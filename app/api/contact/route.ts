import {env} from 'cloudflare:workers';
import {contactDb} from '@/db/contact';
import {sendInquiryNotification, type EmailConfig} from '@/lib/contact-email';
import {z} from 'zod';

const schema=z.object({name:z.string().trim().min(1).max(100),company:z.string().trim().max(150).default(''),email:z.string().trim().email().max(254),phone:z.string().trim().max(40).default(''),message:z.string().trim().min(10).max(5000),category:z.enum(['建築・リフォームの相談','プロジェクト全体の相談','IT・業務改善の相談','その他・まだ決まっていない']),consent:z.literal(true),website:z.string().max(200).default('')});

export async function POST(request:Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({error:'このサイトのフォームから送信してください。'},{status:403});
  if (!request.headers.get('content-type')?.includes('application/json'))
    return Response.json({error:'形式が正しくありません。'},{status:415});
  try {
    const text=await request.text();
    if(text.length>16000)return Response.json({error:'入力が長すぎます。'},{status:413});
    let value:unknown;
    try { value=JSON.parse(text); } catch { return Response.json({error:'形式が正しくありません。'},{status:400}); }
    const parsed=schema.safeParse(value);
    if(!parsed.success)return Response.json({error:'必須項目・メールアドレス・文字数を確認してください。'},{status:400});
    const p=parsed.data;
    if(p.website)return Response.json({error:'送信できませんでした。'},{status:400});
    const db=contactDb();
    const recent=await db.prepare('SELECT count(*) AS n FROM inquiries WHERE email = ? AND created_at > ?')
      .bind(p.email,Date.now()-3600000).first<{n:number}>();
    if(recent&&recent.n>=3)return Response.json({error:'短時間の送信回数が上限に達しました。時間をおいてお試しください。'},{status:429});
    const id=crypto.randomUUID();
    await db.prepare('INSERT INTO inquiries (id,name,company,email,phone,category,message,created_at,notification_status) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(id,p.name,p.company,p.email,p.phone,p.category,p.message,Date.now(),'pending').run();

    // Preserve saved inquiries even when email is unavailable.
    const notification=await sendInquiryNotification(env as unknown as EmailConfig,{...p,id});
    try {
      await db.prepare('UPDATE inquiries SET notification_status = ? WHERE id = ?').bind(notification,id).run();
    } catch { console.error('Contact notification status could not be recorded'); }
    return Response.json({receipt:id,notificationAccepted:notification==='accepted'},{status:201});
  } catch {
    console.error('Contact submission failed');
    return Response.json({error:'送信できませんでした。入力内容を控え、時間をおいて再度お試しください。'},{status:503});
  }
}

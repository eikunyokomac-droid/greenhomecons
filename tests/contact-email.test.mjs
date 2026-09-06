import test from 'node:test';
import assert from 'node:assert/strict';
import {sendInquiryNotification} from '../lib/contact-email.ts';

const config={CLOUDFLARE_EMAIL_ACCOUNT_ID:'0'.repeat(32),CLOUDFLARE_EMAIL_API_TOKEN:'test-only-not-a-real-token',CONTACT_FROM_EMAIL:'info@example.com',CONTACT_TO_EMAIL:'info@example.com'};
const inquiry={id:'test-inquiry',name:'テスト相談者',company:'',email:'visitor@example.org',phone:'',category:'IT・業務改善の相談',message:'これは通知処理の単体テストです。'};

test('missing secret does not attempt to send',async()=>{
  let called=false;
  assert.equal(await sendInquiryNotification({...config,CLOUDFLARE_EMAIL_API_TOKEN:''},inquiry,async()=>{called=true;throw Error();}),'not_configured');
  assert.equal(called,false);
});
test('notification goes only to the configured inbox; visitor is Reply-To',async()=>{
  const result=await sendInquiryNotification(config,{...inquiry,to:'attacker@example.org'},async(url,options)=>{
    assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/'+config.CLOUDFLARE_EMAIL_ACCOUNT_ID+'/email/sending/send');
    const body=JSON.parse(options.body);
    assert.equal(body.to,config.CONTACT_TO_EMAIL);
    assert.equal(body.from,config.CONTACT_FROM_EMAIL);
    assert.equal(body.reply_to,inquiry.email);
    assert.ok(body.text.includes(inquiry.message));
    assert.ok(body.text.includes(inquiry.id));
    assert.equal(body.html,undefined);
    assert.equal(options.redirect,'error');
    return Response.json({success:true,result:{delivered:[],queued:[config.CONTACT_TO_EMAIL],permanent_bounces:[]}});
  });
  assert.equal(result,'accepted');
});
test('delivery status accepts formatted recipient addresses',async()=>{
  const result=await sendInquiryNotification(config,inquiry,async()=>Response.json({
    success:true,
    result:{delivered:['Greenhome <INFO@example.com>'],queued:[],permanent_bounces:[]},
  }));
  assert.equal(result,'accepted');
});
test('provider rejection and bounced recipients are failures',async()=>{
  assert.equal(await sendInquiryNotification(config,inquiry,async()=>Response.json({success:false},{status:403})),'failed');
  assert.equal(await sendInquiryNotification(config,inquiry,async()=>Response.json({success:true,result:{delivered:[],queued:[],permanent_bounces:[config.CONTACT_TO_EMAIL]}})),'failed');
});
test('network failure is unknown and never retried automatically',async()=>{
  let calls=0;
  assert.equal(await sendInquiryNotification(config,inquiry,async()=>{calls++;throw Error('network');}),'unknown');
  assert.equal(calls,1);
});
test('success flag alone does not claim provider acceptance',async()=>{
  assert.equal(await sendInquiryNotification(config,inquiry,async()=>Response.json({success:true,result:{queued:['someone-else@example.org']}})),'unknown');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {sendInquiryNotification} from '../lib/contact-email.ts';

const inquiry={id:'test-inquiry',name:'テスト相談者',company:'',email:'visitor@example.org',phone:'',category:'IT・業務改善の相談',message:'これは通知処理の単体テストです。'};
const config={
  CONTACT_FROM_EMAIL:'info@example.com',
  CONTACT_TO_EMAIL:'info@example.com',
  EMAIL:{send:async()=>({messageId:'test-message'})},
};

test('missing email binding does not attempt to send',async()=>{
  assert.equal(await sendInquiryNotification({...config,EMAIL:undefined},inquiry),'not_configured');
});

test('notification goes only to the configured inbox; visitor is Reply-To',async()=>{
  const sent=[];
  const result=await sendInquiryNotification({...config,EMAIL:{send:async message=>{
    sent.push(message);
    return {messageId:'message-123'};
  }}},{...inquiry,to:'attacker@example.org'});
  assert.equal(result,'accepted');
  assert.equal(sent.length,1);
  assert.equal(sent[0].to,config.CONTACT_TO_EMAIL);
  assert.equal(sent[0].from,config.CONTACT_FROM_EMAIL);
  assert.equal(sent[0].replyTo,inquiry.email);
  assert.ok(sent[0].text.includes(inquiry.message));
  assert.ok(sent[0].text.includes(inquiry.id));
});

test('provider rejection is recorded as failed without retrying',async()=>{
  let calls=0;
  const result=await sendInquiryNotification({...config,EMAIL:{send:async()=>{
    calls++;
    const error=Object.assign(new Error('sender not verified'),{code:'E_SENDER_NOT_VERIFIED'});
    throw error;
  }}},inquiry);
  assert.equal(result,'failed');
  assert.equal(calls,1);
});

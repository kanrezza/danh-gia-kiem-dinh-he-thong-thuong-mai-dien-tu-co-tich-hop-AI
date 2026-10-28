const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const cfg=require('./demo-config.json');const backend=path.join(cfg.runtime,'backend');
process.env.NODE_ENV='test';process.env.DB_HOST='127.0.0.1';process.env.DB_NAME=cfg.testDatabase;
const request=require(path.join(backend,'node_modules/supertest'));
const {app}=require(path.join(backend,'server.js'));const db=require(path.join(backend,'config/db.js'));
const marker='Thong tin rieng tu cua khach hang 2';
async function login(email){const r=await request(app).post('/api/auth/login').send({email,password:'Test@123'});assert.equal(r.status,200);assert.ok(r.body.token);return r.body.token;}
async function get(route,token){let r=request(app).get(route);if(token)r=r.set('Authorization','Bearer '+token);const x=await r;return{status:x.status,body:x.body};}
const has=(r)=>Array.isArray(r.body)&&r.body.some(m=>m.message===marker);
(async()=>{
 const [[target]]=await db.promise().query('SELECT DATABASE() AS name');assert.equal(target.name,'tigershop_video_test');
 const A=await login('customer1@tigershop.test'),B=await login('customer2@tigershop.test');
 const meA=await get('/api/users/me',A),meB=await get('/api/users/me',B);assert.equal(meA.status,200);assert.equal(meB.status,200);assert.notEqual(meA.body.id,meB.body.id);
 const [threads]=await db.promise().query('SELECT DISTINCT t.id,t.user_id FROM threads t JOIN chat_messages m ON m.thread_id=t.id WHERE t.user_id=? AND m.message=?',[meB.body.id,marker]);
 assert.ok(threads.length,'Chua co du lieu CHAT-009; hay chay dung tool05');const thread=threads[0];assert.notEqual(meA.body.id,thread.user_id);
 const route='/api/chat/messages/'+thread.id,anon=await get(route),owner=await get(route,B),cross=await get(route,A);assert.equal(anon.status,401);assert.equal(owner.status,200);assert.ok(has(owner));
 const proof={timestamp:new Date().toISOString(),local_time:new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}),database:target.name,source:'Actual HTTP requests to the unchanged Express app via Supertest temporary port',case:'CHAT-009 / VUL-01',customer_A_id:meA.body.id,customer_B_id:meB.body.id,thread_B_id:thread.id,thread_owner_id:thread.user_id,route,anonymous_http:anon.status,owner_B_http:owner.status,customer_A_http:cross.status,customer_A_received_B_sample:has(cross),sample_text_from_response:has(cross)?cross.body.find(m=>m.message===marker).message:null,expected:'Tu choi doc hoi thoai cua nguoi khac, khong tra du lieu',business_verdict:has(cross)?'FAIL - doc cheo du lieu khach hang':'Chua quan sat thay lo mau trong lan nay'};
 console.log('THOI DIEM:',proof.local_time);console.log('DATABASE:',target.name);console.log('Danh tinh da xac minh bang GET /api/users/me: A='+proof.customer_A_id+', B='+proof.customer_B_id);console.log('Thread B='+thread.id+', owner='+thread.user_id);console.log('GET '+route);
 console.table([{nguoi_goi:'Khong dang nhap',HTTP:anon.status,nhan_tin_B:has(anon)},{nguoi_goi:'Chu hoi thoai B',HTTP:owner.status,nhan_tin_B:has(owner)},{nguoi_goi:'Khach hang A',HTTP:cross.status,nhan_tin_B:has(cross)}]);
 console.log('Cau mau THUC nhan tu response:',proof.sample_text_from_response);console.log('DOI CHIEU NGHIEP VU:',proof.business_verdict);
 fs.writeFileSync(process.argv[2],JSON.stringify(proof,null,2));
})().catch(e=>{console.error('Chua du dieu kien xac minh:',e.message);process.exitCode=1;}).finally(()=>db.end());

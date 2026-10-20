/**
 * Doi chieu kich thuoc phan hoi loi trong tep .jtl voi cac thong bao loi co the co
 * cua orderController.createOrder (muc 5.4.7).
 * JMeter chi luu so byte cua phan hoi (cot bytes, gom ca tieu de HTTP), khong luu noi dung.
 * Kich ban dung mot ung dung Express toi gian voi cung middleware cors() va express.json()
 * nhu server.js, tra ve tung thong bao loi va do tong so byte nhan duoc.
 * Chay: node kiem_tra_kich_thuoc_loi.js (can thu muc backend/node_modules)
 */
const B=require('path').join(__dirname,'..','..','backend','node_modules')+'/';
const express=require(B+'express'), cors=require(B+'cors'), net=require('net');
const app=express(); app.use(cors()); app.use(express.json());
const E=m=>({message:"Lỗi tạo đơn hàng: "+m,error:m});
const bodies={
 thanhcong_4so:[200,{success:true,orderId:1234,expected_delivery:"2026-09-28"}],
 khoachet:[500,E("Deadlock found when trying to get lock; try restarting transaction")],
 chokhoa:[500,E("Lock wait timeout exceeded; try restarting transaction")],
 hethang_1so:[500,E("Hết hàng (sản phẩm chính). Product ID: 7")],
 hethang_3so:[500,E("Hết hàng (sản phẩm chính). Product ID: 160")],
 quanhieuketnoi:[500,E("Too many connections")],
 khonglayduoc:[500,E("Không lấy được thông tin người dùng")],
 auth500:[500,{message:"Lỗi kiểm tra trạng thái tài khoản"}],
};
app.get('/b/:k',(req,res)=>{const [c,b]=bodies[req.params.k]; res.status(c).json(b);});
const s=app.listen(0,async()=>{const port=s.address().port;
 for(const k of Object.keys(bodies)){ await new Promise(done=>{const c=net.connect(port,'127.0.0.1',()=>{c.write(`GET /b/${k} HTTP/1.1\r\nHost: x\r\nConnection: keep-alive\r\n\r\n`)});let buf=Buffer.alloc(0);c.on('data',d=>{buf=Buffer.concat([buf,d]);const i=buf.indexOf('\r\n\r\n');if(i>0){const m=buf.slice(0,i).toString().match(/Content-Length: (\d+)/i);if(m&&buf.length>=i+4+Number(m[1])){console.log(k,buf.length);c.destroy();done();}}});});}
 s.close();});

import fetch from 'node-fetch';

async function testUpload() {
  const fd = new FormData();
  // using a simple base64 image
  fd.append('file', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
  fd.append('upload_preset', 'ml_default');
  
  const res = await fetch('https://api.cloudinary.com/v1_1/dfs6lmdns/image/upload', {
    method: 'POST',
    body: fd
  });
  const data = await res.json();
  console.log(data);
}
testUpload();

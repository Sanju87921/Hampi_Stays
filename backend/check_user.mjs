import { decrypt } from './server/utils/crypto.js';

// The raw DB value for phone
const raw = 'cc9e47b0889e32e83616f1dd:00d28c24b6b1b414555473de67ef4196:3dda6c1ca80a0e20a73a38bd8858e56b83c711045d7dc4a763cdeb88f0610675785fd4e4537406c503db7a393adbb63d7d3bcc054b41056a3b2f941339996c6dd3a747cf5781e54484920153d948a76978e232903bfb994c192c9b3a7e5d76c96e45c5b873f3f8c2e211a3935c12e7c8bba23c76e414acc2ded9095589f9b0d615acc5ad0d130de305016fda759be44d54405e485d3abcb3e87973fef34267c66a9087116550a5f499d7f114f9d05b670db442c69d63186b377008edb86958a22fd706be69d78ccf0d7070c33447c44d8b0ca5d43068';

console.log('=== Testing double-decrypt on phone ===');
const firstPass = decrypt(raw);
console.log('First decrypt:', firstPass);

if (firstPass && firstPass.includes(':')) {
  const secondPass = decrypt(firstPass);
  console.log('Second decrypt:', secondPass);
  
  if (secondPass && secondPass.includes(':')) {
    const thirdPass = decrypt(secondPass);
    console.log('Third decrypt:', thirdPass);
  }
}

// The raw DB value for location
const rawLoc = 'ae106fcdbc51d449bb14c277:02154e4696e54c5ee971815fa996c5c0:cc06825e4364e8c117706816f1303fa3c44e82adb6b8b9107b0e0fa40d5893b4091b909cae4f847bb8196c4ac5ba40a833d2a15f509026c36ef55d883881af8d7baa00fd36ca8901e05cf120fdf5b387191809fa45f0962a7c8a';

console.log('\n=== Testing double-decrypt on location ===');
const firstLocPass = decrypt(rawLoc);
console.log('First decrypt:', firstLocPass);

if (firstLocPass && firstLocPass.includes(':')) {
  const secondLocPass = decrypt(firstLocPass);
  console.log('Second decrypt:', secondLocPass);
}

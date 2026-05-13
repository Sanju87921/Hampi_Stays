import bcrypt from 'bcryptjs';

const password = 'admin@123456';
bcrypt.genSalt(12, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
        console.log('Password Hash:', hash);
    });
});

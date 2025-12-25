import bcrypt from "bcrypt";

const password = "password123";
async function hash() {
    const hashed = await bcrypt.hash(password, 10);
    console.log("Hashed password:");
    console.log(hashed);
}

hash();


require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("readline");
const User = require("./models/User");

// Support either bcrypt or bcryptjs, depending on your installation.
let bcrypt;

try {
    bcrypt = require("bcryptjs");
} catch (error) {
    bcrypt = require("bcrypt");
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function askHidden(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);

        let password = "";

        const stdin = process.stdin;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        function onData(char) {
            if (char === "\u0003") {
                process.stdout.write("\n");
                stdin.setRawMode(false);
                stdin.removeListener("data", onData);
                process.exit(1);
            }

            if (char === "\r" || char === "\n") {
                process.stdout.write("\n");
                stdin.setRawMode(false);
                stdin.removeListener("data", onData);
                resolve(password);
            } else if (char === "\u0008" || char === "\u007f") {
                password = password.slice(0, -1);
            } else {
                password += char;
            }
        }

        stdin.on("data", onData);
    });
}

async function createAdmin() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from your .env file.");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("\nConnected to MongoDB Atlas successfully!");

        const name = (await ask("Enter your name: ")).trim();
        const email = (await ask("Enter your email: ")).trim().toLowerCase();
        const password = await askHidden("Enter your admin password (hidden): ");

        if (!name || !email || password.length < 8) {
            throw new Error("Name and email are required. Password must be at least 8 characters.");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error(
                "An account with this email already exists. No account was changed. We need to check its role before proceeding."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        console.log("\nAdmin account created successfully!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
        console.log("\nYou can now use this account to log in.");
    } catch (error) {
        console.error("\nAdmin setup failed:", error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
}

createAdmin();

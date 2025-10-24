import mongoose from "mongoose";
import Makale from "../models/makaleler.js";
import MasterStudent from "../models/masterStudentModel.js";

const MONGO_URI = "mongodb+srv://dopagraming:pYos44556uO9ky7x@test.g7mtqjx.mongodb.net/teachbook?retryWrites=true&w=majority&appName=Test"

async function run() {
    await mongoose.connect(MONGO_URI);

    const rawId = process.argv[2];
    if (!rawId) {
        console.log("مرر studentId مثل: node scripts/debug-checks.js 68e50556bb1dca052a29a846");
    } else {
        const student = await MasterStudent.findById(rawId);
        console.log("findById:", student ? "FOUND" : "NOT FOUND");
        if (student) console.log(student.toObject());
    }

    const sample = await Makale.find(
        { "studentSubmissions.student": { $exists: true } },
        { "studentSubmissions.student": 1 }
    ).limit(5).lean();
    console.log("Sample studentSubmissions.student:", sample);

    const countStudents = await MasterStudent.countDocuments();
    console.log("masterstudents count:", countStudents);

    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
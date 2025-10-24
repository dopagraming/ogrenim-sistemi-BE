import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const masterStudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    isActive: { type: Boolean, default: false },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

}, {
    collection: "masterstudents",
    timestamps: true,
});

masterStudentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const MasterStudent = mongoose.model("MasterStudent", masterStudentSchema)

export default MasterStudent;

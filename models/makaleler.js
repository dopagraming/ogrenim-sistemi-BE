import mongoose from 'mongoose';


const studentSubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MasterStudent",
        required: true,
    },
    preprocessing: String,
    methods: String,
    classification: String,
    results: String,
    database: String,
    analysis: String,
    labels: String,
    submittedAt: Date,
    lastSavedAt: { type: Date },
    submitted: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ["waiting", "accepted", "rejected"],
        default: "waiting"
    },
    teacherNote: String
}, {
    timestamps: true,
});

const makaleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "makale adı zorunludur"]
    },
    abstract: {
        type: String,
    },
    author: {
        type: String,
    },
    year: {
        type: Number,
        required: [true, "makele yılı zorunludur"]
    },
    journal: {
        type: String,
    },
    volume: {
        type: String,
    },
    number: {
        type: String,
    },
    address: {
        type: String,
        required: [true, "makale adresi zorunludur"]
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MasterStudent',
        }
    ],
    studentSubmissions: [studentSubmissionSchema],
    submissionDeadline: {
        type: Date,
    },
    pdfUrl: { type: String },
    origin: { type: String, enum: ["teacher", "student"], default: "teacher" },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: "MasterStudent" },
    manuscriptSubmission: { type: Boolean, default: true },
    reviewStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    approvedAt: { type: Date },
}, {
    timestamps: true
});

makaleSchema.index({ teacher: 1, createdAt: -1 });

makaleSchema.index(
    {
        name: "text",
        abstract: "text",
        author: "text",
        journal: "text",
        volume: "text",
        number: "text",
        address: "text",
        "studentSubmissions.preprocessing": "text",
        "studentSubmissions.methods": "text",
        "studentSubmissions.classification": "text",
        "studentSubmissions.results": "text",
        "studentSubmissions.database": "text",
        "studentSubmissions.analysis": "text",
        "studentSubmissions.labels": "text",
        "studentSubmissions.teacherNote": "text",
    },
    {
        name: "makale_text_idx",
        weights: {
            name: 6,
            abstract: 5,
            author: 3,
            "studentSubmissions.analysis": 4,
            "studentSubmissions.classification": 4,
        },
        default_language: "english",
    }
);
const Makale = mongoose.model('Makale', makaleSchema);

export default Makale;

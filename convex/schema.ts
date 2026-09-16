import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    studentCode: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
    planName: v.optional(v.string()),
    membershipStatus: v.union(v.literal("trial"), v.literal("active"), v.literal("expired"), v.literal("suspended")),
    membershipStartAt: v.optional(v.number()),
    membershipEndAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_student_code", ["studentCode"]),

  mockAttempts: defineTable({
    userId: v.id("users"),
    mockNumber: v.number(),
    mode: v.union(v.literal("strict"), v.literal("practice")),
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_user_and_mock", ["userId", "mockNumber"]),

  answers: defineTable({
    userId: v.id("users"),
    attemptId: v.id("mockAttempts"),
    skill: v.union(v.literal("listening"), v.literal("reading")),
    questionNumber: v.number(),
    answer: v.string(),
    isCorrect: v.optional(v.boolean()),
    updatedAt: v.number(),
  }).index("by_attempt", ["attemptId"]).index("by_attempt_and_question", ["attemptId", "questionNumber"]),

  weaknesses: defineTable({
    userId: v.id("users"),
    mockNumber: v.number(),
    skill: v.string(),
    questionNumber: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("dismissed")),
    title: v.string(),
    explanation: v.optional(v.string()),
    reviewStage: v.number(),
    nextReviewAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_and_status", ["userId", "status"]),

  vocabulary: defineTable({
    userId: v.id("users"),
    word: v.string(),
    meaning: v.string(),
    sourceMock: v.optional(v.number()),
    sourceQuestion: v.optional(v.number()),
    notes: v.optional(v.string()),
    reviewStage: v.number(),
    nextReviewAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_and_word", ["userId", "word"]),

  writingRecords: defineTable({
    userId: v.id("users"),
    mockNumber: v.optional(v.number()),
    prompt: v.string(),
    essay: v.string(),
    aiFeedback: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  speakingRecords: defineTable({
    userId: v.id("users"),
    setNumber: v.optional(v.number()),
    part: v.optional(v.number()),
    prompt: v.string(),
    answerText: v.string(),
    aiFeedback: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  assignments: defineTable({
    studentUserId: v.id("users"),
    assignedByUserId: v.id("users"),
    mockNumber: v.number(),
    mode: v.union(v.literal("strict"), v.literal("practice")),
    dueAt: v.optional(v.number()),
    status: v.union(v.literal("assigned"), v.literal("completed")),
    createdAt: v.number(),
  }).index("by_student", ["studentUserId"]),
});

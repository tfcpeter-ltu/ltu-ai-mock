import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { grammarResult } from './grammarValidators';
import {speakingPart,partNumber,humanReview,workerReport,jobKind,jobState} from './assessmentValidators';

export default defineSchema({
  ...authTables,
  speakingSessions:defineTable({userId:v.id('users'),setNumber:v.optional(v.number()),status:v.union(v.literal('draft'),v.literal('submitted'),v.literal('reviewed')),parts:v.array(speakingPart),createdAt:v.number(),submittedAt:v.optional(v.number()),humanReview:v.optional(humanReview)}).index('by_user',['userId']).index('by_status',['status']),
  speakingAudio:defineTable({userId:v.id('users'),sessionId:v.id('speakingSessions'),part:partNumber,bytes:v.number(),mimeType:v.string(),state:v.union(v.literal('reserved'),v.literal('stored'),v.literal('cancelled')),storageId:v.optional(v.id('_storage')),createdAt:v.number()}).index('by_user',['userId']).index('by_session_and_part_and_state',['sessionId','part','state']),
  assessmentBudget:defineTable({key:v.string(),bytes:v.number(),pending:v.number()}).index('by_key',['key']),
  assessmentJobs:defineTable({userId:v.id('users'),kind:jobKind,task:v.string(),prompt:v.string(),text:v.string(),model:v.string(),rubric:v.string(),cacheKey:v.string(),status:jobState,createdAt:v.number(),leaseUntil:v.number(),leaseToken:v.optional(v.string()),attempts:v.number(),report:v.optional(workerReport),completedAt:v.optional(v.number()),error:v.optional(v.string())}).index('by_user',['userId']).index('by_user_and_cacheKey',['userId','cacheKey']).index('by_status_and_leaseUntil',['status','leaseUntil']),
  assessmentRate:defineTable({userId:v.id('users'),lastAt:v.number(),windowAt:v.number(),count:v.number()}).index('by_user',['userId']),
  assessmentCalibration:defineTable({model:v.string(),rubric:v.string(),task:v.string(),enabled:v.boolean(),independent:v.literal(true),sampleCount:v.number(),mae:v.number(),withinOne:v.number(),evidenceUrl:v.string(),updatedAt:v.number()}).index('by_model_and_rubric_and_task',['model','rubric','task']),
  grammarState: defineTable({userId:v.id('users'),lastStartedAt:v.number(),windowStartedAt:v.number(),windowCount:v.number(),pendingKey:v.string(),cacheKey:v.optional(v.string()),cachedAt:v.optional(v.number()),result:v.optional(grammarResult)}).index('by_user',['userId']),
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

  cloudState: defineTable({
    userId: v.id("users"),
    stateJson: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

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

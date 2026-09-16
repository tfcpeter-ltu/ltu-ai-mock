import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  return userId;
}

async function getProfile(ctx: any, userId: any) {
  return await ctx.db.query("profiles").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
}

export const ensureProfile = mutation({
  args: { displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await getProfile(ctx, userId);
    if (existing) return existing._id;
    const user = await ctx.db.get(userId);
    const code = `LTU-${String(userId).slice(-6).toUpperCase()}`;
    return await ctx.db.insert("profiles", {
      userId,
      displayName: args.displayName ?? user?.name ?? undefined,
      studentCode: code,
      role: "student",
      planName: "LTU EPT AI 30-Day",
      membershipStatus: "trial",
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await getProfile(ctx, userId);
    const user = await ctx.db.get(userId);
    return { user, profile };
  },
});

export const membershipStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) return { active: false, status: "missing", endAt: null };
    const active = profile.membershipStatus === "active" && !!profile.membershipEndAt && profile.membershipEndAt > Date.now();
    return { active, status: active ? "active" : profile.membershipStatus, endAt: profile.membershipEndAt ?? null };
  },
});

export const activateMembership30Days = mutation({
  args: { studentUserId: v.id("users") },
  handler: async (ctx, { studentUserId }) => {
    const adminUserId = await requireUser(ctx);
    const admin = await getProfile(ctx, adminUserId);
    if (!admin || admin.role !== "admin") throw new Error("Admin only");
    const profile = await getProfile(ctx, studentUserId);
    if (!profile) throw new Error("Student profile not found");
    const now = Date.now();
    await ctx.db.patch(profile._id, {
      planName: "LTU EPT AI NT$5,000 / 30 days",
      membershipStatus: "active",
      membershipStartAt: now,
      membershipEndAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    return true;
  },
});

export const startAttempt = mutation({
  args: { mockNumber: v.number(), mode: v.union(v.literal("strict"), v.literal("practice")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const profile = await getProfile(ctx, userId);
    const active = profile?.membershipStatus === "active" && !!profile.membershipEndAt && profile.membershipEndAt > Date.now();
    if (!active && profile?.membershipStatus !== "trial") throw new Error("Membership inactive");
    return await ctx.db.insert("mockAttempts", {
      userId,
      mockNumber: args.mockNumber,
      mode: args.mode,
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

export const saveAnswer = mutation({
  args: {
    attemptId: v.id("mockAttempts"),
    skill: v.union(v.literal("listening"), v.literal("reading")),
    questionNumber: v.number(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    const existing = await ctx.db.query("answers").withIndex("by_attempt_and_question", q => q.eq("attemptId", args.attemptId).eq("questionNumber", args.questionNumber)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { answer: args.answer, skill: args.skill, updatedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("answers", { userId, ...args, updatedAt: Date.now() });
  },
});

export const submitAttempt = mutation({
  args: { attemptId: v.id("mockAttempts") },
  handler: async (ctx, { attemptId }) => {
    const userId = await requireUser(ctx);
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    await ctx.db.patch(attemptId, { status: "submitted", submittedAt: Date.now() });
    return true;
  },
});

export const listAttempts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db.query("mockAttempts").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
  },
});

export const addWeakness = mutation({
  args: { mockNumber: v.number(), skill: v.string(), questionNumber: v.optional(v.number()), title: v.string(), explanation: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("weaknesses", { userId, ...args, status: "pending", reviewStage: 0, createdAt: Date.now() });
  },
});

export const setWeaknessStatus = mutation({
  args: { id: v.id("weaknesses"), status: v.union(v.literal("confirmed"), v.literal("dismissed")) },
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error("Weakness not found");
    const patch: any = { status };
    if (status === "confirmed") patch.nextReviewAt = Date.now() + 24 * 60 * 60 * 1000;
    await ctx.db.patch(id, patch);
    return true;
  },
});

export const listWeaknesses = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("dismissed"))) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.status) return await ctx.db.query("weaknesses").withIndex("by_user_and_status", q => q.eq("userId", userId).eq("status", args.status!)).order("desc").collect();
    return await ctx.db.query("weaknesses").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
  },
});

export const saveVocab = mutation({
  args: { word: v.string(), meaning: v.string(), sourceMock: v.optional(v.number()), sourceQuestion: v.optional(v.number()), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query("vocabulary").withIndex("by_user_and_word", q => q.eq("userId", userId).eq("word", args.word)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return await ctx.db.insert("vocabulary", { userId, ...args, reviewStage: 0, nextReviewAt: Date.now() + 24 * 60 * 60 * 1000, createdAt: Date.now() });
  },
});

export const listVocab = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db.query("vocabulary").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
  },
});

export const saveWriting = mutation({
  args: { mockNumber: v.optional(v.number()), prompt: v.string(), essay: v.string(), aiFeedback: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("writingRecords", { userId, ...args, createdAt: Date.now() });
  },
});

export const listWriting = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db.query("writingRecords").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
  },
});

export const saveSpeaking = mutation({
  args: { setNumber: v.optional(v.number()), part: v.optional(v.number()), prompt: v.string(), answerText: v.string(), aiFeedback: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("speakingRecords", { userId, ...args, createdAt: Date.now() });
  },
});

export const listSpeaking = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db.query("speakingRecords").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect();
  },
});

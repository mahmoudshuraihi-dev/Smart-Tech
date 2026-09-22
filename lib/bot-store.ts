"use client";

import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { AutoReplyRule, BotSettings } from "./models";

const REF_PATH = ["config", "botSettings"] as const;

const DEFAULT_SETTINGS: BotSettings = {
  welcomeMessage: "",
  rules: [],
  ruleAnswers: [],
};

function settingsRef() {
  return doc(db, ...REF_PATH);
}

export async function getBotSettingsOnce(): Promise<BotSettings> {
  const snap = await getDoc(settingsRef());
  return snap.exists() ? (snap.data() as BotSettings) : DEFAULT_SETTINGS;
}

export function subscribeToBotSettings(cb: (s: BotSettings) => void): () => void {
  return onSnapshot(settingsRef(), (snap) => {
    cb(snap.exists() ? (snap.data() as BotSettings) : DEFAULT_SETTINGS);
  });
}

async function ensureDoc(): Promise<BotSettings> {
  const snap = await getDoc(settingsRef());
  if (snap.exists()) return snap.data() as BotSettings;
  await setDoc(settingsRef(), DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateWelcomeMessage(welcomeMessage: string): Promise<void> {
  await ensureDoc();
  await updateDoc(settingsRef(), { welcomeMessage });
}

export async function addRule(q: string, a: string): Promise<AutoReplyRule> {
  const current = await ensureDoc();
  const rule: AutoReplyRule = { id: `RULE-${Date.now()}-${Math.floor(Math.random() * 1000)}`, q, a };
  const rules = [...current.rules, rule];
  await updateDoc(settingsRef(), { rules, ruleAnswers: rules.map((r) => r.a) });
  return rule;
}

export async function updateRule(id: string, q: string, a: string): Promise<void> {
  const current = await ensureDoc();
  const rules = current.rules.map((r) => (r.id === id ? { ...r, q, a } : r));
  await updateDoc(settingsRef(), { rules, ruleAnswers: rules.map((r) => r.a) });
}

export async function deleteRule(id: string): Promise<void> {
  const current = await ensureDoc();
  const rules = current.rules.filter((r) => r.id !== id);
  await updateDoc(settingsRef(), { rules, ruleAnswers: rules.map((r) => r.a) });
}

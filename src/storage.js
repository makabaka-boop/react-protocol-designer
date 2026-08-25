const STORAGE_KEYS = {
  PROTOCOLS: 'protocol_designer_protocols',
  CURRENT_ID: 'protocol_designer_current_id',
  DRAFTS: 'protocol_designer_drafts',
};

function safeParse(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProtocols() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.PROTOCOLS), []);
}

export function saveProtocols(protocols) {
  localStorage.setItem(STORAGE_KEYS.PROTOCOLS, JSON.stringify(protocols));
}

export function loadCurrentProtocolId() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_ID);
}

export function saveCurrentProtocolId(id) {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ID);
  }
}

export function loadDrafts() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.DRAFTS), {});
}

export function saveDraft(protocolId, draftData) {
  const drafts = loadDrafts();
  drafts[protocolId] = {
    ...draftData,
    draftSavedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  return drafts[protocolId];
}

export function loadDraft(protocolId) {
  const drafts = loadDrafts();
  return drafts[protocolId] || null;
}

export function deleteDraft(protocolId) {
  const drafts = loadDrafts();
  delete drafts[protocolId];
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
}

export function hasDraft(protocolId) {
  const drafts = loadDrafts();
  return !!drafts[protocolId];
}

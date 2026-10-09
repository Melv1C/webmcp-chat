export type Page = "desk" | "done" | "shop";

export type Job = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
};

type State = {
  jobs: Array<Job>;
  nextId: number;
};

const STORAGE_KEY = "spoke-spoke-jobs";

const seed: State = {
  nextId: 1045,
  jobs: [
    {
      id: "1042",
      title: "True the rear wheel on the red Peugeot",
      notes: "Spoke on the drive side is loose. Customer picks up Friday.",
      done: false,
    },
    {
      id: "1043",
      title: "Replace cassette, 11-28",
      notes: "11-speed. Keep the old lockring.",
      done: false,
    },
    {
      id: "1044",
      title: "Bleed the hydraulic brakes",
      notes: "Front only. Mineral oil, not DOT.",
      done: true,
    },
  ],
};

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seed;
    }
    const parsed = JSON.parse(raw) as State;
    if (!Array.isArray(parsed.jobs) || typeof parsed.nextId !== "number") {
      return seed;
    }
    return parsed;
  } catch {
    return seed;
  }
}

let state = load();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): State {
  return state;
}

export function listJobs(status: "open" | "done" | "all" = "all") {
  if (status === "open") {
    return state.jobs.filter((job) => !job.done);
  }
  if (status === "done") {
    return state.jobs.filter((job) => job.done);
  }
  return state.jobs;
}

export function addJob(title: string, notes = "") {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("A job needs a title.");
  }
  const job: Job = {
    id: String(state.nextId),
    title: trimmed,
    notes: notes.trim(),
    done: false,
  };
  state = { jobs: [job, ...state.jobs], nextId: state.nextId + 1 };
  emit();
  return job;
}

export function updateJob(
  id: string,
  patch: { title?: string; notes?: string; done?: boolean },
) {
  const index = state.jobs.findIndex((job) => job.id === id);
  if (index < 0) {
    throw new Error(`No job ${id} on the board.`);
  }
  const current = state.jobs[index];
  const next: Job = {
    ...current,
    title: patch.title?.trim() || current.title,
    notes: patch.notes === undefined ? current.notes : patch.notes.trim(),
    done: patch.done ?? current.done,
  };
  const jobs = state.jobs.slice();
  jobs[index] = next;
  state = { ...state, jobs };
  emit();
  return next;
}

export function deleteJob(id: string) {
  const job = state.jobs.find((item) => item.id === id);
  if (!job) {
    throw new Error(`No job ${id} on the board.`);
  }
  state = { ...state, jobs: state.jobs.filter((item) => item.id !== id) };
  emit();
  return { deleted: id, title: job.title };
}

function parsePage(hash = location.hash): Page {
  const page = hash.replace(/^#\/?/, "");
  if (page === "done" || page === "shop") {
    return page;
  }
  return "desk";
}

export function getPage(): Page {
  return parsePage();
}

export function openPage(page: Page) {
  const hash = `#/${page}`;
  if (location.hash !== hash) {
    location.hash = hash;
  }
  emit();
  return { page, url: location.href };
}

export function subscribeToPage(listener: () => void) {
  window.addEventListener("hashchange", listener);
  const unsubscribe = subscribe(listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    unsubscribe();
  };
}

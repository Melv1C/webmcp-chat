import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  addJob,
  deleteJob,
  getPage,
  getSnapshot,
  openPage,
  subscribe,
  subscribeToPage,
  updateJob,
  type Job,
  type Page,
} from "./store";

function useJobs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function usePage() {
  return useSyncExternalStore(subscribeToPage, getPage, getPage);
}

function JobTicket({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(job.title);
  const [notes, setNotes] = useState(job.notes);

  function save(event: FormEvent) {
    event.preventDefault();
    updateJob(job.id, { title, notes });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="ticket">
        <span className="stub">{job.id}</span>
        <form className="ticket-body" onSubmit={save}>
          <label>
            Job
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              rows={2}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <p className="ticket-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </p>
        </form>
      </li>
    );
  }

  return (
    <li className="ticket">
      <span className="stub">{job.id}</span>
      <div className="ticket-body">
        <label className="done">
          <input
            type="checkbox"
            checked={job.done}
            onChange={(event) =>
              updateJob(job.id, { done: event.target.checked })
            }
          />
          <span>Done</span>
        </label>
        <h2>{job.title}</h2>
        {job.notes ? <p>{job.notes}</p> : null}
        <p className="ticket-actions">
          <button type="button" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={() => deleteJob(job.id)}>
            Delete
          </button>
        </p>
      </div>
    </li>
  );
}

function Desk({ jobs }: { jobs: Array<Job> }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  function create(event: FormEvent) {
    event.preventDefault();
    addJob(title, notes);
    setTitle("");
    setNotes("");
  }

  return (
    <section>
      <h1>Desk</h1>
      <p className="lede">
        Open jobs for the stand. Chat can add, edit, finish, or throw a ticket
        out.
      </p>
      <form className="new-job" onSubmit={create}>
        <label>
          New job
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Adjust the derailleur on the blue Soma"
          />
        </label>
        <label>
          Notes
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
          />
        </label>
        <button type="submit">Add to desk</button>
      </form>
      {jobs.length === 0 ? (
        <p className="empty">No open jobs. Add one, or ask the chat to.</p>
      ) : (
        <ol className="tickets">
          {jobs.map((job) => (
            <JobTicket key={job.id} job={job} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Done({ jobs }: { jobs: Array<Job> }) {
  return (
    <section>
      <h1>Done</h1>
      <p className="lede">Finished work. Reopen a job or delete it for good.</p>
      {jobs.length === 0 ? (
        <p className="empty">Nothing finished yet.</p>
      ) : (
        <ol className="tickets">
          {jobs.map((job) => (
            <JobTicket key={job.id} job={job} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Shop() {
  return (
    <section>
      <h1>Shop</h1>
      <p className="lede">
        Spoke &amp; Spoke is a one-stand shop. This page is the host. The chat
        in the corner lives in a shadow root, so this page never shares CSS
        with it. It only sees tools the shop registered.
      </p>
      <dl className="hours">
        <div>
          <dt>Hours</dt>
          <dd>Tue–Sat, 10–18</dd>
        </div>
        <div>
          <dt>Tools</dt>
          <dd>
            getPageContext, listJobs, addJob, updateJob, deleteJob, openPage
          </dd>
        </div>
      </dl>
    </section>
  );
}

const links: Array<{ page: Page; label: string }> = [
  { page: "desk", label: "Desk" },
  { page: "done", label: "Done" },
  { page: "shop", label: "Shop" },
];

export function App() {
  const { jobs } = useJobs();
  const page = usePage();
  const open = jobs.filter((job) => !job.done);
  const done = jobs.filter((job) => job.done);

  useEffect(() => {
    const titles: Record<Page, string> = {
      desk: "Desk · Spoke & Spoke",
      done: "Done · Spoke & Spoke",
      shop: "Shop · Spoke & Spoke",
    };
    document.title = titles[page];
  }, [page]);

  return (
    <div className="shop">
      <header className="masthead">
        <p className="mark">Spoke &amp; Spoke</p>
        <nav aria-label="Shop">
          {links.map((link) => (
            <a
              key={link.page}
              href={`#/${link.page}`}
              aria-current={page === link.page ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                openPage(link.page);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        {page === "desk" ? <Desk jobs={open} /> : null}
        {page === "done" ? <Done jobs={done} /> : null}
        {page === "shop" ? <Shop /> : null}
      </main>
      <webmcp-chat />
    </div>
  );
}

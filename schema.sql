create table tasks (
  id bigint primary key generated always as identity,
  text text not null,
  priority text default 'normal',
  done boolean default false,
  created_at timestamptz default now()
);

create table goals (
  id bigint primary key generated always as identity,
  text text not null,
  progress integer default 0,
  created_at timestamptz default now()
);

create table journal_entries (
  id bigint primary key generated always as identity,
  date_key text unique not null,
  text text default '',
  mood text default '',
  updated_at timestamptz default now()
);

create table notes (
  id bigint primary key generated always as identity,
  title text not null,
  content text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ideas (
  id bigint primary key generated always as identity,
  text text not null,
  date text,
  created_at timestamptz default now()
);

create table calendar_events (
  id bigint primary key generated always as identity,
  date_key text not null,
  text text not null,
  created_at timestamptz default now()
);

alter table tasks disable row level security;
alter table goals disable row level security;
alter table journal_entries disable row level security;
alter table notes disable row level security;
alter table ideas disable row level security;
alter table calendar_events disable row level security;

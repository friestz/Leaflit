
import React, { useState, useEffect } from "react";
import {
  AuthForm,
  ProfileView,
  StoryForm,
  StoryList,
  average,
  AntiCopyShield,
  getUserAverageRating,
} from "./components.jsx"; // when you split, move components to this file

const STORAGE_KEY = "greenwattpad_v3";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function GreenWattpadApp() {
  const [db, setDb] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // seed with demo content
    return {
      users: {
        guest: { password: "guest", createdAt: Date.now(), bio: "Loves green stories", avatar: null },
      },
      stories: [
        {
          id: uid(),
          title: "The Bamboo Road",
          author: "guest",
          content: "A soft rain fell over the town. On the green bamboo road, she waited for a letter that never came...",
          likes: 3,
          likedBy: [],
          ratings: { guest: 5 },
          createdAt: Date.now(),
        },
      ],
    };
  });

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY + "_session");
    return raw ? JSON.parse(raw) : null;
  });

  const [view, setView] = useState("home"); // home | profile | post | search
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY + "_session", JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY + "_session");
  }, [user]);

  // -- auth & user helpers --
  function signup(username, password, bio) {
    if (!username || !password) return { ok: false, message: "Provide username & password" };
    if (db.users[username]) return { ok: false, message: "Username already exists" };
    const users = { ...db.users, [username]: { password, createdAt: Date.now(), bio: bio || "", avatar: null } };
    setDb({ ...db, users });
    setUser({ username });
    return { ok: true };
  }

  function login(username, password) {
    const u = db.users[username];
    if (!u || u.password !== password) return { ok: false, message: "Wrong username or password" };
    setUser({ username });
    return { ok: true };
  }

  function logout() {
    setUser(null);
    setView("home");
  }

  // -- stories --
  function addStory(title, content) {
    if (!user) return { ok: false, message: "You must be logged in" };
    if (!title || !content) return { ok: false, message: "Fill title & content" };
    const newStory = {
      id: uid(),
      title,
      author: user.username,
      content,
      likes: 0,
      likedBy: [],
      ratings: {},
      createdAt: Date.now(),
    };
    setDb({ ...db, stories: [newStory, ...db.stories] });
    return { ok: true };
  }

  function toggleLike(storyId) {
    if (!user) return { ok: false, message: "Login to like" };
    const stories = db.stories.map((s) => {
      if (s.id !== storyId) return s;
      const has = s.likedBy.includes(user.username);
      const likedBy = has ? s.likedBy.filter((x) => x !== user.username) : [...s.likedBy, user.username];
      return { ...s, likedBy, likes: likedBy.length };
    });
    setDb({ ...db, stories });
    return { ok: true };
  }

  function rateStory(storyId, stars) {
    if (!user) return { ok: false };
    const stories = db.stories.map((s) => {
      if (s.id !== storyId) return s;
      const ratings = { ...s.ratings, [user.username]: stars };
      return { ...s, ratings };
    });
    setDb({ ...db, stories });
    return { ok: true };
  }

  function updateAvatar(file) {
    if (!user) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const users = { ...db.users, [user.username]: { ...db.users[user.username], avatar: e.target.result } };
      setDb({ ...db, users });
    };
    reader.readAsDataURL(file);
  }

  // search
  const filteredStories = searchTerm
    ? db.stories.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.author.toLowerCase().includes(searchTerm.toLowerCase()))
    : db.stories;

  // famous users: compute average rating per user across their stories and mark high-rated users
  const userRatings = Object.keys(db.users).map((username) => {
    const stories = db.stories.filter((s) => s.author === username);
    const avg = stories.length ? average(stories.flatMap((s) => Object.values(s.ratings))) : 0;
    return { username, avg, storiesCount: stories.length };
  });

  // famous = avg >= 4.0 and at least 1 story
  const famousUsers = userRatings.filter((u) => u.storiesCount > 0).sort((a, b) => b.avg - a.avg);

  const currentUserData = user ? db.users[user.username] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl shadow">G</div>
            <div>
              <h1 className="text-2xl font-extrabold">GreenBook</h1>
              <p className="text-sm text-green-800/80">share stories, connect, inspire</p>
            </div>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setView("profile")} className="px-3 py-1 rounded bg-green-100 text-green-800 text-sm">Profile</button>
                <button onClick={() => setView("post")} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Post a story</button>
                <button onClick={logout} className="px-3 py-1 rounded bg-green-700 text-white text-sm">Logout</button>
              </div>
            ) : (
              <AuthForm onLogin={login} onSignup={signup} />
            )}
          </div>
        </header>

        <main>
          {view === "home" && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Latest stories</h2>
              <StoryList stories={filteredStories} currentUser={user} onLike={toggleLike} onRate={rateStory} />

              <div className="mt-6 p-4 bg-white/80 rounded-2xl shadow">
                <h3 className="font-semibold mb-2">Famous Users</h3>
                <ul className="space-y-1 text-sm">
                  {famousUsers.map((u) => (
                    <li key={u.username} className="flex items-center justify-between">
                      <div>
                        <strong>{u.username}</strong>
                        {u.avg >= 4 && u.storiesCount > 0 && <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-200 rounded">FAMOUS</span>}
                        <div className="text-xs text-gray-500">Avg: {u.avg.toFixed(1)} — {u.storiesCount} story(ies)</div>
                      </div>
                      <div className="text-sm">⭐ {u.avg.toFixed(1)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {view === "profile" && currentUserData && (
            <ProfileView username={user.username} data={currentUserData} stories={db.stories.filter((s) => s.author === user.username)} onAvatar={updateAvatar} />
          )}

          {view === "post" && user && (
            <div className="p-4 rounded-2xl bg-white shadow">
              <h3 className="font-semibold mb-2">Write a new story</h3>
              <StoryForm onAdd={addStory} onPosted={() => setView("home")} />
            </div>
          )}
        </main>
      </div>

      {/* bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-200 p-3 flex gap-2 justify-around text-sm">
        <button onClick={() => { setView("home"); setSearchTerm(""); }} className="font-semibold">Home</button>
        <button onClick={() => setView("search")} className="font-semibold">Search</button>
      </div>

      {/* search overlay */}
      {view === "search" && (
        <div className="fixed inset-0 bg-white p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 mb-4">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search stories or users..." className="flex-1 px-3 py-2 rounded border" />
              <button onClick={() => setView("home")} className="px-3 py-2 bg-green-600 text-white rounded">Close</button>
            </div>
            <StoryList stories={filteredStories} currentUser={user} onLike={toggleLike} onRate={rateStory} />
          </div>
        </div>
      )}

      <AntiCopyShield />
    </div>
  );
}

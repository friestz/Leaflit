import React, { useState, useEffect } from "react";

export function AuthForm({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState(null);

  function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (mode === "login") {
      const res = onLogin(username.trim(), password);
      if (!res.ok) setMsg(res.message);
    } else {
      const res = onSignup(username.trim(), password, bio.trim());
      if (!res.ok) setMsg(res.message);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
      <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="px-2 py-1 rounded border" />
      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="px-2 py-1 rounded border" />
      {mode === "signup" && (
        <input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="short bio" className="px-2 py-1 rounded border" />
      )}
      <button type="submit" className="px-3 py-1 rounded bg-green-600 text-white text-sm">{mode === "login" ? "Login" : "Sign up"}</button>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login") } className="text-sm text-green-800/70">{mode === "login" ? "Create" : "Have acct?"}</button>
      {msg && <div className="text-red-600 text-sm w-full">{msg}</div>}
    </form>
  );
}

export function ProfileView({ username, data, stories, onAvatar }) {
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) onAvatar(file);
  }

  return (
    <div className="p-4 rounded-2xl bg-white shadow">
      <div className="flex items-center gap-4 mb-4">
        {data.avatar ? (
          <img src={data.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">{username[0].toUpperCase()}</div>
        )}
        <div>
          <h2 className="text-xl font-bold">{username}</h2>
          <p className="text-sm text-gray-600">{data.bio || "No bio yet"}</p>
          <input type="file" accept="image/*" capture="environment" onChange={handleAvatarChange} className="text-sm mt-2" />
        </div>
      </div>
      <h3 className="font-semibold mb-2">Your Stories</h3>
      <StoryList stories={stories} currentUser={{ username }} />
    </div>
  );
}

export function StoryForm({ onAdd, onPosted }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState(null);

  function submit(e) {
    e.preventDefault();
    setMsg(null);
    const res = onAdd(title.trim(), content.trim());
    if (!res.ok) setMsg(res.message);
    else {
      setTitle("");
      setContent("");
      if (onPosted) onPosted();
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title" className="px-3 py-2 rounded border" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your story..." rows={6} className="px-3 py-2 rounded border resize-none"></textarea>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 bg-green-700 text-white rounded">Post</button>
        {msg && <span className="text-sm text-green-800">{msg}</span>}
      </div>
    </form>
  );
}

export function StoryList({ stories, currentUser, onLike, onRate }) {
  if (!stories || stories.length === 0) return <div className="text-sm text-gray-600">No stories yet</div>;
  return (
    <div className="space-y-4">
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} currentUser={currentUser} onLike={onLike} onRate={onRate} />
      ))}
    </div>
  );
}

export function StoryCard({ story, currentUser, onLike, onRate }) {
  const liked = currentUser ? story.likedBy.includes(currentUser.username) : false;
  const userRating = currentUser ? story.ratings[currentUser.username] || 0 : 0;
  const avgRating = average(Object.values(story.ratings));

  return (
    <article className="p-4 bg-white/90 rounded-2xl shadow no-select" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{story.title}</h3>
          <div className="text-xs text-gray-500">by {story.author} • {new Date(story.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="text-sm text-gray-600">{story.likes} ♥</div>
      </div>

      <p className="mt-3 text-gray-800 leading-relaxed story-content" style={{ whiteSpace: "pre-wrap" }}>{story.content}</p>

      {onLike && (
        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => onLike(story.id)} className={`px-3 py-1 rounded ${liked ? "bg-green-700 text-white" : "bg-green-100 text-green-800"}`}>
            {liked ? "Liked" : "Like"}
          </button>
        </div>
      )}

      {onRate && (
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => onRate(story.id, star)} className={star <= userRating ? "text-yellow-500" : "text-gray-400"}>★</button>
          ))}
          <span className="text-xs text-gray-600 ml-2">Avg: {avgRating.toFixed(1)}</span>
        </div>
      )}
    </article>
  );
}

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function getUserAverageRating(username, stories) {
  const their = stories.filter((s) => s.author === username);
  if (their.length === 0) return 0;
  const all = their.flatMap((s) => Object.values(s.ratings));
  return average(all);
}

export function AntiCopyShield() {
  useEffect(() => {
    function handleCopy(e) {
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      e.preventDefault();
      try { e.clipboardData.setData("text/plain", "Copying disabled on GreenBook."); } catch (err) {}
    }
    function handleSelectStart(e) {
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      e.preventDefault();
    }
    function handleContext(e) { e.preventDefault(); }

    document.addEventListener("copy", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("contextmenu", handleContext);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, []);

  return (
    <style>
      {`.no-select { user-select: none; -webkit-user-select: none; }
      .story-content { user-select: none; -webkit-user-select: none; }
      input, textarea { user-select: text; -webkit-user-select: text; }
      `}
    </style>
  );
}


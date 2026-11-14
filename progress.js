/* progress.js – all localStorage access lives here. Safe if storage is blocked. */
const LQProgress = (() => {
  const KEY = "lunarQuest.progress.v1";
  let state = { explored: {}, quiz: {} };   // quiz[id] = true (correct) / false (answered wrong)
  try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); } catch (e) { /* use defaults */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  return {
    markExplored(id) { state.explored[id] = true; save(); },
    recordQuiz(id, correct) { state.quiz[id] = state.quiz[id] === true ? true : correct; save(); },
    isExplored: id => !!state.explored[id],
    quizResult: id => state.quiz[id],
    summary(total) {
      const explored = Object.keys(state.explored).length;
      const correct = Object.values(state.quiz).filter(v => v === true).length;
      return { explored, correct, total, readiness: Math.round(((explored / total) * 50) + ((correct / total) * 50)) };
    },
    reset() { state = { explored: {}, quiz: {} }; save(); }
  };
})();

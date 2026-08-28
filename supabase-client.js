(function () {
  const config = window.CONECTATECH_SUPABASE || {};
  const hasConfig = Boolean(config.url && config.anonKey && window.supabase?.createClient);
  const client = hasConfig ? window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }) : null;

  function mapTrack(row) {
    return {
      id: row.slug,
      remoteId: row.id,
      icon: row.icon || '▣',
      title: row.title,
      level: row.level,
      lessons: row.lesson_count,
      time: minutesToText(row.estimated_minutes),
      description: row.description
    };
  }

  function minutesToText(minutes) {
    if (!minutes) return 'Conteúdo curto';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}min`;
    if (!rest) return `${hours}h`;
    return `${hours}h ${rest}min`;
  }

  async function getUser() {
    if (!client) return null;
    const {data} = await client.auth.getUser();
    return data.user || null;
  }

  async function signUp(email, password, fullName) {
    if (!client) return {error: new Error('Supabase não configurado')};
    return client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          display_name: fullName
        }
      }
    });
  }

  async function signIn(email, password) {
    if (!client) return {error: new Error('Supabase não configurado')};
    return client.auth.signInWithPassword({email, password});
  }

  async function signOut() {
    if (!client) return {error: new Error('Supabase não configurado')};
    return client.auth.signOut({scope: 'local'});
  }

  function onAuthStateChange(callback) {
    if (!client) return {data: {subscription: {unsubscribe() {}}}};
    return client.auth.onAuthStateChange(callback);
  }

  async function listTracks() {
    if (!client) return null;
    const {data, error} = await client
      .from('tracks')
      .select('id, slug, title, description, level, icon, estimated_minutes, lesson_count, sort_order')
      .eq('status', 'published')
      .order('sort_order', {ascending: true});
    if (error) throw error;
    return data.map(mapTrack);
  }

  async function listOpportunities() {
    if (!client) return null;
    const {data, error} = await client
      .from('opportunities')
      .select('id, type, title, organization, description, location, deadline, url')
      .eq('status', 'published')
      .order('created_at', {ascending: false})
      .limit(6);
    if (error) throw error;
    return data;
  }

  async function countCompletedLessons() {
    const user = await getUser();
    if (!client || !user) return 0;
    const {count, error} = await client
      .from('lesson_progress')
      .select('id', {count: 'exact', head: true})
      .eq('user_id', user.id)
      .eq('status', 'completed');
    if (error) throw error;
    return count || 0;
  }

  async function saveDiagnostic(payload, remoteTrackId) {
    const user = await getUser();
    if (!client || !user) return {remote: false, reason: 'login_required'};
    const {error} = await client.from('diagnostics').insert({
      user_id: user.id,
      goal: payload.goal,
      device: payload.device,
      connection_quality: payload.connection,
      accessibility_support: payload.support,
      recommended_track_id: remoteTrackId || null
    });
    if (error) throw error;
    return {remote: true};
  }

  async function saveFeedback(payload) {
    const user = await getUser();
    if (!client) return {remote: false};
    const {error} = await client.from('feedbacks').insert({
      user_id: user?.id || null,
      rating: payload.rating,
      comment: payload.comment
    });
    if (error) throw error;
    return {remote: true};
  }

  async function saveProgress(track) {
    const user = await getUser();
    if (!client || !user || !track?.remoteId) return {remote: false, reason: 'login_required'};
    const {data: lesson, error: lessonError} = await client
      .from('lessons')
      .select('id')
      .eq('track_id', track.remoteId)
      .eq('status', 'published')
      .order('sort_order', {ascending: true})
      .limit(1)
      .maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return {remote: false, reason: 'lesson_not_found'};

    const {error} = await client.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      status: 'completed',
      score: 100,
      completed_at: new Date().toISOString()
    }, {onConflict: 'user_id,lesson_id'});
    if (error) throw error;
    return {remote: true};
  }

  window.conectaDb = {
    client,
    isConfigured: Boolean(client),
    getUser,
    signUp,
    signIn,
    signOut,
    onAuthStateChange,
    listTracks,
    listOpportunities,
    countCompletedLessons,
    saveDiagnostic,
    saveFeedback,
    saveProgress
  };
})();

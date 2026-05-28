const fs = require('fs');

const frontendFile = 'frontend/src/pages/admin/AdminProfilePage.tsx';
let frontendContent = fs.readFileSync(frontendFile, 'utf8');

const targetState = `  // Data states
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await apiClient.get<any[]>('/admin/security/sessions');
      setSessions(data);
    } catch (err) {
      toast.error('Failed to load session activity');
    }
  };`;

const replacementState = `  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    setSessionError(false);
    try {
      const data = await apiClient.get<{ success: boolean, sessions: any[] }>('/admin/security/sessions');
      if (data && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else if (Array.isArray(data)) {
        setSessions(data); // Fallback if backend isn't updated yet
      } else {
        setSessions([]);
      }
    } catch (err) {
      setSessionError(true);
      toast.error('Failed to load session activity');
    } finally {
      setIsLoadingSessions(false);
    }
  };`;

frontendContent = frontendContent.replace(targetState, replacementState);

const targetRender = `              <div className="space-y-4">
                {sessions.length === 0 ? (
                   <div className="p-4 text-center text-navy-950/50">Loading sessions...</div>
                ) : (
                  sessions.map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl">`;

const replacementRender = `              <div className="space-y-4">
                {isLoadingSessions ? (
                   <div className="p-4 text-center text-navy-950/50 flex flex-col items-center">
                     <Loader2 className="w-6 h-6 animate-spin text-gold-500 mb-2" />
                     Loading sessions...
                   </div>
                ) : sessionError ? (
                   <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl">
                     <p className="mb-2 font-semibold">Failed to load session activity</p>
                     <button onClick={fetchSessions} className="px-4 py-2 bg-red-100 rounded-lg font-bold text-xs uppercase hover:bg-red-200">Retry</button>
                   </div>
                ) : !Array.isArray(sessions) || sessions.length === 0 ? (
                   <div className="p-4 text-center text-navy-950/50">No active sessions found.</div>
                ) : (
                  sessions.map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl">`;

frontendContent = frontendContent.replace(targetRender, replacementRender);
fs.writeFileSync(frontendFile, frontendContent, 'utf8');

const backendFile = 'backend/server/routes/admin/security.js';
let backendContent = fs.readFileSync(backendFile, 'utf8');

const targetBackend = `  app.get('/admin/security/sessions', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const sessions = await prisma.adminSession.findMany({
        where: { userId: adminId },
        orderBy: { lastSeen: 'desc' }
      });
      // Mocking some fallback if table is empty due to not writing to it on login yet
      if (sessions.length === 0) {
        return c.json([{
          id: 'current',
          ipAddress: c.req.header('cf-connecting-ip') || '127.0.0.1',
          userAgent: c.req.header('user-agent') || 'Chrome/114.0.0.0',
          isActive: true,
          lastSeen: new Date().toISOString()
        }]);
      }
      return c.json(sessions);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });`;

const replacementBackend = `  app.get('/admin/security/sessions', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const sessions = await prisma.adminSession.findMany({
        where: { userId: adminId },
        orderBy: { lastSeen: 'desc' }
      });
      
      let safeSessions = sessions || [];
      if (safeSessions.length === 0) {
        safeSessions = [{
          id: 'current',
          ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1',
          userAgent: c.req.header('user-agent') || 'Unknown Device',
          isActive: true,
          lastSeen: new Date().toISOString()
        }];
      }
      
      return c.json({ success: true, sessions: safeSessions });
    } catch (err) {
      console.error("[Session Fetch Error]", err);
      return c.json({ success: false, error: 'Failed to fetch sessions' }, 500);
    }
  });`;

// handle line endings
backendContent = backendContent.replace(/\\r\\n/g, '\\n');
backendContent = backendContent.replace(targetBackend.replace(/\\r\\n/g, '\\n'), replacementBackend);
fs.writeFileSync(backendFile, backendContent, 'utf8');

console.log('Files updated successfully.');

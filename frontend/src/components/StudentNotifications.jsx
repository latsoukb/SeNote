import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useStudentClass } from '../context/StudentClassContext';
import NewCommBanner from './NewCommBanner';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, enrolled, newCount } = useStudentClass();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const prevNewCountRef = useRef(newCount);

  const openReception = () => {
    navigate('/?view=reception');
  };

  useEffect(() => {
    if (newCount > prevNewCountRef.current) setBannerDismissed(false);
    prevNewCountRef.current = newCount;
  }, [newCount]);

  useEffect(() => {
    const onReception =
      location.pathname === '/' && location.search.includes('view=reception');
    if (onReception || newCount === 0) setBannerDismissed(true);
  }, [location, newCount]);

  useEffect(() => {
    const onNew = (e) => {
      const items = e.detail?.items || [];
      if (!items.length) return;
      setBannerDismissed(false);
      const first = items[0];
      toast('Nouveau message de votre professeur', {
        description: `${first.teacherName} — ${first.title || first.body?.slice(0, 40)}`,
        duration: 10000,
        icon: <Bell className="w-4 h-4 text-brand-600" />,
        action: {
          label: 'Voir',
          onClick: openReception,
        },
      });
    };
    window.addEventListener('senote:new-communications', onNew);
    return () => window.removeEventListener('senote:new-communications', onNew);
  }, []);

  if (!session?.displayName || !enrolled) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {!bannerDismissed && newCount > 0 && (
        <NewCommBanner
          count={newCount}
          onOpen={openReception}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
    </div>
  );
};

export default StudentNotifications;

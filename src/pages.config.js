import Achievements from './pages/Achievements';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminClasses from './pages/AdminClasses';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditUser from './pages/AdminEditUser';
import AdminScoreboard from './pages/AdminScoreboard';
import AdminUserTemplates from './pages/AdminUserTemplates';
import AdminUsers from './pages/AdminUsers';
import CompleteProfile from './pages/CompleteProfile';
import ContentGenerator from './pages/ContentGenerator';
import EditProfile from './pages/EditProfile';
import Gamification from './pages/Gamification';
import Home from './pages/Home';
import LearningResources from './pages/LearningResources';
import Messages from './pages/Messages';
import Scoreboard from './pages/Scoreboard';
import ScoringRules from './pages/ScoringRules';
import StudentAssignments from './pages/StudentAssignments';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentStore from './pages/StudentStore';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherClasses from './pages/TeacherClasses';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherReports from './pages/TeacherReports';
import TeacherScoreboard from './pages/TeacherScoreboard';
import YaraChat from './pages/YaraChat';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminActivityLogs": AdminActivityLogs,
    "AdminClasses": AdminClasses,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminEditUser": AdminEditUser,
    "AdminScoreboard": AdminScoreboard,
    "AdminUserTemplates": AdminUserTemplates,
    "AdminUsers": AdminUsers,
    "CompleteProfile": CompleteProfile,
    "ContentGenerator": ContentGenerator,
    "EditProfile": EditProfile,
    "Gamification": Gamification,
    "Home": Home,
    "LearningResources": LearningResources,
    "Messages": Messages,
    "Scoreboard": Scoreboard,
    "ScoringRules": ScoringRules,
    "StudentAssignments": StudentAssignments,
    "StudentDashboard": StudentDashboard,
    "StudentProfile": StudentProfile,
    "StudentStore": StudentStore,
    "TeacherAssignments": TeacherAssignments,
    "TeacherClasses": TeacherClasses,
    "TeacherDashboard": TeacherDashboard,
    "TeacherReports": TeacherReports,
    "TeacherScoreboard": TeacherScoreboard,
    "YaraChat": YaraChat,
}

export const pagesConfig = {
    mainPage: "StudentDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
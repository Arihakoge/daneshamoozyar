import Achievements from './pages/Achievements';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminClasses from './pages/AdminClasses';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import AdminScoreboard from './pages/AdminScoreboard';
import AdminUserTemplates from './pages/AdminUserTemplates';
import AdminUsers from './pages/AdminUsers';
import CompleteProfile from './pages/CompleteProfile';
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
import StudentNotebook from './pages/StudentNotebook';
import StudyGroups from './pages/StudyGroups';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminActivityLogs": AdminActivityLogs,
    "AdminClasses": AdminClasses,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminReports": AdminReports,
    "AdminScoreboard": AdminScoreboard,
    "AdminUserTemplates": AdminUserTemplates,
    "AdminUsers": AdminUsers,
    "CompleteProfile": CompleteProfile,
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
    "StudentNotebook": StudentNotebook,
    "StudyGroups": StudyGroups,
}

export const pagesConfig = {
    mainPage: "StudentDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
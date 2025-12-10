import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import YaraChat from './pages/YaraChat';
import StudentAssignments from './pages/StudentAssignments';
import StudentProfile from './pages/StudentProfile';
import TeacherAssignments from './pages/TeacherAssignments';
import AdminDashboard from './pages/AdminDashboard';
import TeacherClasses from './pages/TeacherClasses';
import AdminUsers from './pages/AdminUsers';
import AdminClasses from './pages/AdminClasses';
import CompleteProfile from './pages/CompleteProfile';
import Scoreboard from './pages/Scoreboard';
import TeacherScoreboard from './pages/TeacherScoreboard';
import AdminScoreboard from './pages/AdminScoreboard';
import EditProfile from './pages/EditProfile';
import AdminEditUser from './pages/AdminEditUser';
import TeacherReports from './pages/TeacherReports';
import Achievements from './pages/Achievements';
import ContentGenerator from './pages/ContentGenerator';
import Messages from './pages/Messages';
import ScoringRules from './pages/ScoringRules';
import AdminContent from './pages/AdminContent';
import __Layout from './Layout.jsx';


export const PAGES = {
    "StudentDashboard": StudentDashboard,
    "TeacherDashboard": TeacherDashboard,
    "YaraChat": YaraChat,
    "StudentAssignments": StudentAssignments,
    "StudentProfile": StudentProfile,
    "TeacherAssignments": TeacherAssignments,
    "AdminDashboard": AdminDashboard,
    "TeacherClasses": TeacherClasses,
    "AdminUsers": AdminUsers,
    "AdminClasses": AdminClasses,
    "CompleteProfile": CompleteProfile,
    "Scoreboard": Scoreboard,
    "TeacherScoreboard": TeacherScoreboard,
    "AdminScoreboard": AdminScoreboard,
    "EditProfile": EditProfile,
    "AdminEditUser": AdminEditUser,
    "TeacherReports": TeacherReports,
    "Achievements": Achievements,
    "ContentGenerator": ContentGenerator,
    "Messages": Messages,
    "ScoringRules": ScoringRules,
    "AdminContent": AdminContent,
}

export const pagesConfig = {
    mainPage: "StudentDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
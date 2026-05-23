import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./StudentDashboard.css";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import StudentAIChat from "./StudentAIChat";
import { COURSE_CATALOG } from "../data/courseCatalog";
import InfiniteMenu from "../components/InfiniteMenu";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskFilter, setTaskFilter] = useState("All task");

  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [sub, setSub] = useState(null);
  const scrollRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("student_notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
    return [
      { id: 1, title: "Math conspect", content: "A linear equation is an equation of the form: ax+b=c, where x is the variable, a, b, and c are constants.", date: "May 05, 2025", color: "bg-emerald-200" },
      { id: 2, title: "Biology conspect", content: "A cell is the basic structural, functional, and biological unit of all living organisms. It is the smallest unit.", date: "Apr 29, 2025", color: "bg-purple-200" }
    ];
  });

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState("bg-emerald-200");

  useEffect(() => {
    localStorage.setItem("student_notes", JSON.stringify(notes));
  }, [notes]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteColor("bg-emerald-200");
    setNoteModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color);
    setNoteModalOpen(true);
  };

  const taskFilters = ["All task", "To do", "In progress", "Done"];

  const tasks = [
    { title: "Read poem & answer questions", subject: "English Literature", date: "Apr 28, 2025", comments: 12, status: "In progress", progress: 60 },
    { title: "Create a comic strip with a story", subject: "Social Studies", date: "May 17, 2025", comments: 0, status: "To do", progress: 0 },
    { title: "Prepare for the math test", subject: "Math", date: "May 11, 2025", comments: 2, status: "To do", progress: 0 },
    { title: "Read the chapter about plant and animal", subject: "Biology", date: "Apr 22, 2025", comments: 3, status: "To do", progress: 0 },
  ];



  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingSchedule(false);
        return;
      }
      try {
        const response = await axios.get("http://localhost:3000/api/subscriptions/me/schedule", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setSub(response.data?.subscription || null);
        setSchedules(Array.isArray(response.data?.schedules) ? response.data.schedules : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingSchedule(false);
      }
    };

    loadSchedule();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTeachers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No token found");
        setLoadingTeachers(false);
        return;
      }
      try {
        console.log("🔄 Fetching teachers from API...");
        const response = await axios.get("http://localhost:3000/api/users/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ API Response:", response.data);
        if (mounted && response.data?.success) {
          const teacherList = response.data.teachers || [];
          console.log(`✅ Found ${teacherList.length} teachers:`, teacherList);
          setTeachers(teacherList);
        } else {
          console.warn("⚠️ API returned success=false or no teachers");
          setTeachers([]);
        }
      } catch (err) {
        console.error("❌ Error fetching teachers:", err?.response?.data || err.message);
        setTeachers([]);
      } finally {
        if (mounted) setLoadingTeachers(false);
      }
    };
    fetchTeachers();
    return () => { mounted = false; };
  }, []);

  const menuItems = useMemo(() => {
    return teachers && teachers.length > 0 
      ? teachers.map(t => ({
          image: t.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&h=400&fit=crop",
          title: t.name || "Instructor",
          description: `${t.instrumentExpertise || "Music"} • ★ ${t.ratings?.averageRating || "5.0"} (${t.ratings?.totalRatings || 0} reviews)`,
          link: `/teachers/${t.id || t._id}`
        }))
      : [];
  }, [teachers]);
  
  // Debug logging
  console.log(`📊 Teachers state: ${teachers?.length || 0} teachers`, teachers);
  console.log(`📋 Menu items: ${menuItems.length} items`, menuItems);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isScrolling = false;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();

        if (isScrolling) return;
        isScrolling = true;

        const cardWidth = 246; // 230px card + 16px gap (gap-4)
        const direction = e.deltaY > 0 ? 1 : -1;

        el.scrollTo({
          left: el.scrollLeft + direction * cardWidth,
          behavior: "smooth"
        });

        setTimeout(() => {
          isScrolling = false;
        }, 400); // match smooth animation timing
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <StudentLayout>
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto h-full pt-4 pr-1 custom-scrollbar pb-10">
        
        {/* Top Section - Dashboard Grid (Layout preserved inside a fixed row height) */}
        <div className="flex gap-4 h-[680px] flex-shrink-0">
          
          {/* Left Column - My Tasks */}
          <div className="w-[45%] bg-white rounded-[2rem] p-7 flex flex-col shadow-sm overflow-hidden h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[26px] font-bold">My tasks</h2>
            <button className="w-10 h-10 border-2 border-gray-100 rounded-[14px] flex items-center justify-center text-xl text-gray-500 hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div className="flex gap-2.5 mb-7">
            {taskFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`px-5 py-2.5 rounded-[1.25rem] text-[14px] font-bold transition-colors ${
                  taskFilter === filter ? "bg-[#1e1e1e] text-white" : "border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {tasks.filter(t => taskFilter === "All task" || t.status === taskFilter).map((task, idx) => (
              <div key={idx} className="flex flex-col gap-1 pb-6 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-[17px] leading-snug">{task.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${
                    task.status === "In progress" ? "bg-[#ffe2c2] text-[#d97c23]" : "bg-[#ded6ff] text-[#7a5cff]"
                  }`}>
                    {task.status}
                  </span>
                </div>
                <span className="text-[13px] text-gray-400 font-medium mb-1 mt-1">{task.subject}</span>
                <div className="flex justify-between items-center text-[13px] text-gray-400 font-medium">
                  <span>{task.date}</span>
                  <span>{task.comments > 0 ? `${task.comments} comments` : "No comments"}</span>
                </div>
                {task.status === "In progress" && (
                  <div className="w-full h-[6px] bg-gray-100 rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-green-400 rounded-full" style={{ width: `${task.progress}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3.5 border-2 border-gray-100 rounded-[1.25rem] font-bold text-[15px] text-gray-600 hover:bg-gray-50 transition-colors">
            View all tasks
          </button>
        </div>

        {/* Right Column - Notes, Schedule, & Instruments */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* My Notes */}
          <div className="bg-white rounded-[2rem] p-7 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[26px] font-bold">My notes</h2>
              <button 
                onClick={handleOpenCreate}
                className="w-10 h-10 border-2 border-gray-100 rounded-[14px] flex items-center justify-center text-xl text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>

            <div className="flex gap-4 min-h-[140px]">
              {notes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f8f9fb] border border-gray-100 rounded-[1.5rem] text-center gap-2">
                  <span className="text-sm font-bold text-gray-400">No notes created yet.</span>
                  <button onClick={handleOpenCreate} className="text-xs font-extrabold text-purple-600 hover:underline cursor-pointer">
                    Create your first note
                  </button>
                </div>
              ) : (
                notes.map((note) => (
                  <div 
                    key={note.id} 
                    onClick={() => handleOpenEdit(note)}
                    className={`flex-1 ${note.color} rounded-[1.5rem] p-6 flex flex-col text-gray-800 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 border border-black/5 hover:shadow-sm shadow-xs min-h-[160px]`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-[17px] text-gray-900 leading-tight pr-4">{note.title}</h3>
                      <button className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-800 hover:bg-white/60 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                    </div>
                    <p className="text-[14px] font-medium leading-[1.6] opacity-90 flex-1 text-gray-800 line-clamp-2 pr-1">
                      {note.content}
                    </p>
                    <span className="text-[13px] font-bold text-gray-700/80 mt-4">{note.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Area - Schedule & Featured Instruments */}
          <div className="flex-1 flex gap-4 overflow-hidden h-full">
            {/* My Schedule (50%) */}
            <div className="flex-[1] bg-white rounded-[2rem] p-7 shadow-sm overflow-hidden flex flex-col h-full">
               <div className="flex justify-between items-center mb-6">
                <h2 className="text-[26px] font-bold">My schedule</h2>
                <button onClick={() => navigate("/schedule")} className="px-4 py-2 border-2 border-gray-100 rounded-[14px] flex items-center gap-2 text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors">
                  Weekly Timetable 
                  <span className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-4 text-[13px] font-bold text-gray-400 mb-4 px-4">
                <div>Time</div>
                <div>Lesson</div>
                <div>Teacher</div>
                <div>Location</div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {loadingSchedule ? (
                  <div className="text-center py-10 text-gray-400 font-semibold text-sm">Loading schedule...</div>
                ) : schedules.length === 0 ? (
                  <div className="text-center p-6 flex flex-col justify-center items-center h-full gap-3 text-gray-400 font-bold text-sm bg-[#f8f9fb] rounded-[1.5rem] border border-gray-50">
                    <span>No classes scheduled yet.</span>
                    <button className="px-4 py-2 bg-[#1e1e1e] text-white rounded-[12px] text-xs font-bold hover:bg-black transition-colors" onClick={() => navigate("/pay")}>
                      Subscribe to a Course
                    </button>
                  </div>
                ) : (
                  schedules.map((slot, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center bg-[#f8f9fb] rounded-[1.25rem] p-3 px-4 text-[14px] font-bold">
                      <div className="text-gray-600">{slot.startTime}</div>
                      <div className="text-gray-900 truncate pr-2">{slot.instrument || sub?.instrument || "Class"}</div>
                      <div className="flex items-center gap-2.5 text-gray-900 truncate pr-2">
                        <img src={`https://i.pravatar.cc/150?img=${idx + 10}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="Teacher" />
                        <span className="truncate">{sub?.teacherName || "Instructor"}</span>
                      </div>
                      <div className="text-gray-600 truncate">{slot.room || "Online"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Featured Instruments (50%) */}
            <div className="flex-[1] bg-white rounded-[2rem] p-5 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[24px] font-extrabold text-gray-900">Featured Classes</h2>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-4 custom-scrollbar pb-2 snap-x snap-mandatory items-center">
                {COURSE_CATALOG.map((course) => (
                  <div
                    key={course.slug}
                    onClick={() => setSelectedCourse(course)}
                    className="group w-[230px] h-[115px] relative rounded-[1.25rem] overflow-hidden cursor-pointer transition-all active:scale-[0.98] shadow-sm flex-shrink-0 snap-start"
                  >
                    {/* Background Image */}
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10"></div>
                    
                    {/* Overlay Text Content */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-3.5 text-white">
                      <div>
                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none block">{course.instrument}</span>
                        <strong className="text-[13.5px] font-extrabold text-white leading-tight mt-1 block truncate">{course.title}</strong>
                        <p className="text-[10px] text-gray-200/80 font-medium leading-snug mt-0.5 line-clamp-1">{course.shortDescription}</p>
                      </div>
                      <span className="text-[9px] text-purple-300 font-bold flex items-center gap-1 mt-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {course.classesPerWeek}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Teachers Section - Our Music Instructors (Full Width) */}
      <div className="bg-[#0e0e0e] text-white rounded-[2rem] p-8 shadow-md overflow-hidden flex flex-col relative flex-shrink-0 h-[460px] border border-white/5">
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
          <span className="text-[12px] font-bold text-purple-400 uppercase tracking-widest leading-none">Global Music Faculty</span>
          <h2 className="text-[28px] font-extrabold tracking-tight mt-1 text-white">Browse Our Instructors</h2>
          <p className="text-[14.5px] text-gray-400 font-semibold max-w-lg mt-1 leading-normal">
            {menuItems.length > 0
              ? "Drag, swipe, or spin the 3D spherical deck below to explore our verified roster. Click the action button on a selected teacher to open their profile."
              : loadingTeachers
                ? "Loading instructors..."
                : "No registered instructors yet. Check back soon!"
            }
          </p>
        </div>

        <div className="flex-1 w-full h-full relative animate-fade-in" style={{ minHeight: "340px" }}>
          {loadingTeachers ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold text-gray-500">Loading instructors...</span>
              </div>
            </div>
          ) : menuItems.length > 0 ? (
            <InfiniteMenu items={menuItems} scale={0.9} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-[15px] font-bold text-gray-400">No instructors registered yet</span>
                <span className="text-[13px] text-gray-600 font-medium">Instructors will appear here once they join the platform.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
      <StudentAIChat user={user} />

      {/* Popout Immersive Preview Modal */}
      {selectedCourse && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedCourse(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-[620px] w-full flex flex-col md:flex-row relative animate-scale-up border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-700 font-extrabold z-30 cursor-pointer shadow-sm border border-gray-100"
              onClick={() => setSelectedCourse(null)}
            >
              ✕
            </button>

            {/* Left Panel: Image */}
            <div className="md:w-[45%] h-[200px] md:h-auto relative overflow-hidden flex-shrink-0">
               <img 
                 src={selectedCourse.image} 
                 alt={selectedCourse.title} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
            </div>

            {/* Right Panel: Content Details */}
            <div className="md:w-[55%] p-7 flex flex-col justify-between min-w-0">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-1">
                  {selectedCourse.instrument}
                </span>
                <h3 className="text-[24px] font-extrabold text-gray-900 leading-tight">
                  {selectedCourse.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mt-3">
                  {selectedCourse.shortDescription || "Unlock your creative musical potential with expert mentorship, modern group learning, and personalized weekly schedules."}
                </p>
                <p className="text-[12px] text-gray-400 mt-2">
                  Dive deep into rhythm, notation, performance psychology, and group collaboration under custom guided pathways.
                </p>

                {/* Metrics */}
                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-purple-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>Frequency: {selectedCourse.classesPerWeek}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-purple-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>Level: Beginner to Advanced Roster</span>
                  </div>
                </div>
              </div>

              {/* View Course Action */}
              <button 
                onClick={() => {
                  navigate(`/courses/${selectedCourse.slug}`);
                  setSelectedCourse(null);
                }}
                className="w-full py-3.5 bg-[#1e1e1e] hover:bg-black text-white rounded-[1rem] font-bold text-[14px] transition-all active:scale-[0.98] mt-6 flex justify-center items-center gap-2 shadow-sm cursor-pointer"
              >
                View Course Page
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create / Edit Note Modal */}
      {noteModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setNoteModalOpen(false);
            setEditingNote(null);
          }}
        >
          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-[460px] w-full p-8 relative animate-scale-up border border-gray-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500 font-bold cursor-pointer"
              onClick={() => {
                setNoteModalOpen(false);
                setEditingNote(null);
              }}
            >
              ✕
            </button>

            <h3 className="text-[24px] font-extrabold text-gray-900 mb-6">
              {editingNote ? "Edit note" : "Create note"}
            </h3>

            <div className="space-y-5 flex-1">
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Note Title</label>
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Piano Exercises" 
                  className="w-full px-4 py-3 bg-[#f8f9fb] border border-gray-100 rounded-[1rem] font-bold text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Content textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Note Content</label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type your notes here..." 
                  rows={4}
                  className="w-full px-4 py-3 bg-[#f8f9fb] border border-gray-100 rounded-[1rem] font-medium text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Color Select Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Color Theme</label>
                <div className="flex gap-3">
                  {[
                    { color: "bg-emerald-200", label: "Green" },
                    { color: "bg-purple-200", label: "Purple" },
                    { color: "bg-sky-200", label: "Blue" },
                    { color: "bg-amber-200", label: "Yellow" },
                    { color: "bg-rose-200", label: "Rose" },
                  ].map((theme) => (
                    <button 
                      key={theme.color}
                      type="button"
                      onClick={() => setNoteColor(theme.color)}
                      className={`w-9 h-9 rounded-full ${theme.color} border-2 transition-all cursor-pointer ${
                        noteColor === theme.color ? "border-gray-800 scale-110 shadow-sm" : "border-transparent hover:scale-105"
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex gap-3">
              {editingNote && (
                <button 
                  onClick={() => {
                    setNotes(notes.filter(n => n.id !== editingNote.id));
                    setNoteModalOpen(false);
                    setEditingNote(null);
                  }}
                  className="px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[1rem] font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                  title="Delete Note"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button 
                onClick={() => {
                  if (!noteTitle.trim()) return;
                  if (editingNote) {
                    // Update
                    setNotes(notes.map(n => n.id === editingNote.id ? {
                      ...n,
                      title: noteTitle,
                      content: noteContent,
                      color: noteColor,
                      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                    } : n));
                  } else {
                    // Create
                    setNotes([...notes, {
                      id: Date.now(),
                      title: noteTitle,
                      content: noteContent,
                      color: noteColor,
                      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                    }]);
                  }
                  setNoteModalOpen(false);
                  setEditingNote(null);
                }}
                disabled={!noteTitle.trim()}
                className="flex-1 py-3.5 bg-[#1e1e1e] hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[1rem] font-bold text-[14px] transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-1 shadow-sm"
              >
                {editingNote ? "Save Changes" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;

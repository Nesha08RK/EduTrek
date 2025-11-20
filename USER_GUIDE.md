# Assessment & Video Tracking - User Guide

## For Instructors

### Step 1: Create a Course
1. Go to **Instructor Dashboard**
2. Click **Create Course**
3. Fill in course details and create modules with videos
4. Save the course

### Step 2: Add Assessment
1. Open the course you created
2. Scroll to the bottom (Instructor section)
3. Click **Add Assessment**
4. Fill in assessment details:
   - **Title**: e.g., "Module 1 Quiz"
   - **Description**: Brief description of what the assessment covers
   - **Duration**: Time limit in minutes (e.g., 30)
   - **Passing Score**: Percentage required to pass (default: 70%)
   - **Questions**: 
     - Click "Add Question" for each question
     - Enter question text
     - Enter 4 answer options
     - Select the correct answer by clicking the radio button
     - Click "Remove Question" to delete
5. Click **Create Assessment**
6. The assessment is now linked to this course

### Step 3: View Student Progress
1. Go to **Instructor Dashboard**
2. Click on a course
3. Scroll to **Enrolled Students** section
4. See each student's:
   - Progress percentage
   - Videos watched
   - Assessment status
   - Score (if taken)

---

## For Students

### Step 1: Enroll in a Course
1. Browse available courses
2. Click on a course card
3. Click **Enroll** button
4. You'll be redirected to your dashboard

### Step 2: Watch Course Videos
1. Go to **Student Dashboard**
2. Click **Continue** on the course card
3. In the course content section, you'll see modules
4. Click **Watch** on any video
5. Watch the video - progress will automatically track:
   - Progress bar shows percentage watched
   - Watch time displayed (e.g., "2:45 / 5:00")
   - When you reach 90% watched: ✓ "Video completed!"
6. Click **Back to course content** to return to module list
7. Repeat for all videos

### Step 3: Monitor Your Progress
1. Return to **Student Dashboard**
2. You'll see your course progress:
   - Progress percentage (0-100%)
   - Status messages:
     - 📚 "Keep watching to unlock assessment" (0-99%)
     - ✓ "All videos watched! Ready to take assessment." (100%)
     - ✓ "Completed" (after passing assessment)
   - Progress bar visualization

### Step 4: Take the Assessment

#### Before Starting:
1. Ensure you've watched **all course videos**
2. If not, the assessment will be locked with message:
   - "You must watch all course videos before taking the assessment"
   - Shows progress: "X/Y videos watched"

#### Starting the Test:
1. Click on your course in Student Dashboard
2. Scroll down to Assessment section
3. Click **Start Assessment** (only available after all videos watched)
4. Read the **Important: Test Mode Rules**:
   - ✓ Test will run in fullscreen for security
   - ✓ Cannot exit fullscreen or switch tabs
   - ✓ Developer tools are disabled
   - ✓ Answers auto-saved
   - ✓ Auto-submits when time expires
   - ✓ Can submit before time runs out
5. Click **Start Test**
6. Browser enters fullscreen automatically

#### During the Test:
1. **Timer displayed** in top-right:
   - Shows time remaining
   - Changes color when time is low:
     - Gray: 5+ minutes
     - Orange: 1-5 minutes
     - Red pulsing: < 1 minute
2. **Question counter** shows progress (e.g., "15/20 answered")
3. **Select answers** by clicking radio buttons
4. **Answers auto-save** as you select them
5. **View any question** in any order
6. **Submit anytime** by clicking "Submit Assessment" button
   - Button shows answer count (e.g., "15/20 answered")

#### If Time Expires:
- Test **automatically submits**
- You don't need to do anything
- Results displayed automatically

#### After Submission:
1. Results shown:
   - **Score**: Percentage (e.g., 85%)
   - **Correct Answers**: Count (e.g., 17/20 correct)
   - **Pass/Fail**: Status with emoji
   - ✅ PASSED if score ≥ passing score
   - ❌ Failed if score < passing score
2. **Certificate generated** if you passed
3. Return to course page

### Step 5: Viewing Your Certificate
1. If you passed the assessment
2. Go to course page → scroll to Assessment section
3. Your **Certificate of Completion** displayed
4. Download or print the certificate

---

## Common Scenarios

### Scenario 1: Student Hasn't Watched All Videos
```
Status: Assessment Locked
Message: "You must watch all course videos before taking the assessment"
Progress: "Watched 3/5 videos"
Progress Bar: Shows 60% complete
Action: Click "Back to Watch Videos" to continue watching
```

### Scenario 2: Student Watching Video
```
Video Title: "Introduction to React"
Progress Bar: Shows 45% watched
Watch Time: "2:15 / 5:00"
Status: (when reaches 90%) ✓ "Video completed! (Syncing...)"
Completion: Saved to server and shows on dashboard
```

### Scenario 3: Student Takes Assessment
```
Before Test:
- Information screen showing 20 questions, 30 minutes, 70% passing score
- Rules about fullscreen and security
- "Start Test" button

During Test:
- Timer: "29:45" (ticking down)
- Question: "What is React?" with 4 options
- Button: "Submit Assessment (12/20 answered)"
- If tries to exit fullscreen: Warning "Fullscreen exited! Returning..."

After Test (Manual Submit):
- Alert: "Assessment submitted! Score: 85% (17/20 correct) ✅ PASSED"
- Redirected to certificate page

After Test (Time Expires):
- Automatic submission occurs
- Results displayed immediately
```

### Scenario 4: Student Returns to Course Later
```
Student Dashboard:
- Course card shows: 100% Complete
- Status badge: ✓ "Completed"
- Progress bar: Full (green)
- Button: "Continue" or view certificate
```

---

## Features Summary

### Video Tracking ✓
- Automatic detection when 90% watched
- Visual progress bar (0-100%)
- Watch time display
- Completion indicators
- Server synchronization

### Assessment Gating ✓
- Only available after ALL videos watched
- Clear locked status message
- Progress indicator
- Button to return to videos

### Proctored Testing ✓
- Fullscreen enforcement
- Developer tools blocked
- Shortcuts disabled (F12, Ctrl+R, etc.)
- Tab switching detected and warned
- Exam security preserved

### Automatic Submission ✓
- Test submits automatically when time expires
- No action needed from student
- Results shown immediately
- Can submit early if desired

### Progress Tracking ✓
- Real-time progress percentage
- Video completion count
- Assessment readiness indicator
- Completion badges
- Visual progress bars

### User Experience ✓
- Clear status messages
- Helpful warnings
- Progress indicators
- Easy navigation
- Mobile responsive

---

## Troubleshooting

### Video Won't Mark as Complete
- Ensure you watch at least 90% of the video
- Wait for "Video completed!" message
- Refresh page to sync if needed

### Assessment Still Locked After Watching All Videos
- Return to Student Dashboard
- Refresh the page
- Click on course again
- Assessment should now be available

### Fullscreen Not Working
- Ensure browser supports fullscreen API
- Check if fullscreen is blocked in browser settings
- Try different browser (Chrome, Firefox, Safari, Edge)
- Test can still continue without fullscreen

### Timer Not Showing
- Ensure assessment has duration set
- Refresh page if timer appears stuck
- Check browser console for errors

### Can't Select Answers
- Ensure you're in fullscreen mode (if test started)
- Check if answer is actually selecting
- Try clicking directly on radio button
- Refresh if buttons not responding

### Test Submitted but No Certificate
- Check if you passed (score ≥ passing score)
- Only passing scores generate certificates
- Refresh page to see certificate
- Check email for certificate notification

---

## Tips for Success

1. **Watch all videos**: Required for assessment access
2. **Note the time limit**: Set by your instructor
3. **Review before submitting**: Check answers if time allows
4. **Stay in fullscreen**: Warnings appear if you exit
5. **Answer all questions**: Helps maximize score
6. **Submit before time**: Avoid relying on auto-submit
7. **Print certificate**: Save your achievement

---

## FAQ

**Q: Can I pause and resume a video?**
A: Yes, pause anytime. Progress will be saved and tracked.

**Q: Do I need to watch the entire video?**
A: No, just 90% is enough. The progress bar shows your percentage watched.

**Q: Can I retake the assessment?**
A: Depends on your instructor's settings. Contact them for retake policy.

**Q: What if my connection drops during test?**
A: Your answers are saved. Reconnect and resume. Test continues counting down.

**Q: Can I switch to another app during test?**
A: You'll get a warning, but can continue. You'll be warned about tab switches.

**Q: What's the minimum passing score?**
A: Set by your instructor (default 70%). Check assessment page.

**Q: How long is the certificate valid?**
A: Certificates are permanent records of your completion.

**Q: Can I download my certificate?**
A: Yes, click the certificate and use browser's print/save function.

---

## Support

For technical issues:
1. Check troubleshooting section above
2. Clear browser cache and cookies
3. Try different browser
4. Contact your instructor
5. Report bugs to support team

For course content questions:
- Contact your instructor
- Review course materials
- Check course announcements

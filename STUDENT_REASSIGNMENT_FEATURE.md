# Student Reassignment Feature - Implementation Guide

## Overview
Teachers can now reassign their students from one group to another directly from the Teacher Dashboard. This provides flexibility in managing student placements across different class groups.

## What's New

### Backend Changes

#### 1. **New API Endpoint**
- **Route**: `POST /api/teacher/groups/reassign`
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "subscriptionId": "student_subscription_id",
    "newGroupId": "target_group_id"
  }
  ```

#### 2. **New Controller Function: `reassignStudentToGroup`**
Location: `server/controllers/teacherController.js`

**Features**:
- ✅ Validates student subscription exists
- ✅ Verifies teacher owns the student's current subscription
- ✅ Ensures target group belongs to the teacher
- ✅ Checks group capacity before reassignment
- ✅ Validates instrument compatibility
- ✅ Updates group fill counts automatically
- ✅ Returns detailed success message with student and group info

**Validation Checks**:
- Student must be assigned to the teacher
- Target group must belong to the same teacher
- Target group must have available capacity
- Student's instrument must match group's instrument
- Cannot reassign to the same group

**Error Handling**:
```
- Student subscription not found → 404
- Unauthorized reassignment → 403
- Target group not found → 404
- Group at full capacity → 400
- Instrument mismatch → 400
- Server errors → 500
```

### Frontend Changes

#### 1. **Enhanced Teacher Dashboard**
Location: `frontend/src/pages/TeacherDashboard.jsx`

**New State Variables**:
```javascript
- showReassignModal: Boolean to control modal visibility
- selectedStudentForReassign: Current student being reassigned
- reassigningStudentId: ID of student being processed
- selectedNewGroupId: Target group ID for reassignment
```

**New Functions**:
- `openReassignModal(student)`: Opens reassignment modal for a student
- `handleReassignStudent()`: Calls API to reassign student

#### 2. **Updated UI Components**

**Group Card Enhancement**:
- Each student card now displays a "↔ Reassign" button
- Button is styled in purple with hover effects
- Easy access to reassignment functionality

**Reassignment Modal**:
- Shows student name and current group
- Dropdown to select target group
- Displays group capacity info
- Shows "FULL" indicator for groups at capacity
- Filters out:
  - The student's current group
  - Groups with no capacity
- Cancel and Reassign buttons
- Loading state during submission

## How It Works

### Step-by-Step Process

1. **View Groups**: Teacher views the "Your Active Groups" section on the dashboard
2. **Select Student**: Click the "↔ Reassign" button on any student card
3. **Choose Target**: Modal appears with available groups
4. **Confirm**: Select new group and click "Reassign"
5. **Auto-Update**: Dashboard refreshes automatically

### Data Flow

```
Frontend                         Backend
  │                               │
  ├─ POST /groups/reassign ──────→ │
  │                               │
  │                      Validate request
  │                        (subscription,
  │                         teacher,
  │                         group, capacity)
  │                               │
  │                      Update Subscription
  │                      Refresh group fills
  │                               │
  │ ←─ Success response ──────────┤
  │                               │
  └─ Reload dashboard ────────────→
     Refresh all data
```

## Key Features

### ✅ Capacity Management
- Groups have defined capacity limits
- System prevents reassignment to full groups
- Automatic capacity recalculation on reassignment

### ✅ Data Integrity
- Student's instrument must match group's instrument
- Teacher can only reassign their own students
- Prevents invalid state transitions

### ✅ User Experience
- One-click reassignment from group overview
- Modal confirmation with clear information
- Real-time error messaging
- Success feedback on completion
- Automatic dashboard refresh

### ✅ Safety Checks
- Cannot reassign to current group
- Cannot reassign to other teachers' groups
- Validates all constraints before processing
- Detailed error messages for troubleshooting

## API Response Example

### Success Response
```json
{
  "success": true,
  "message": "Student \"John Doe\" reassigned to group \"Advanced Piano\" successfully",
  "subscription": {
    "_id": "subscription_id",
    "user": { "name": "John Doe", "email": "john@example.com" },
    "group": "new_group_id",
    "groupName": "Advanced Piano",
    "instrument": "Piano"
  },
  "newGroup": {
    "_id": "new_group_id",
    "groupName": "Advanced Piano",
    "instrument": "Piano",
    "filled": 5,
    "capacity": 8
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Group \"Beginner Piano\" is at full capacity (8/8)"
}
```

## Integration Points

### Models Used
- **Subscription**: Stores student-teacher-group relationship
- **Group**: Defines group details (name, capacity, instrument)
- **User**: Student and teacher information

### Middleware
- `auth.js`: `protect` middleware validates teacher authentication

## Testing Scenarios

### Test Case 1: Basic Reassignment
1. Create 2 groups with same instrument
2. Assign student to Group 1
3. Reassign to Group 2
4. Verify: Subscription updated, fill counts adjusted

### Test Case 2: Capacity Validation
1. Create group with capacity 1
2. Fill the group
3. Try to reassign another student to it
4. Verify: Error message about full capacity

### Test Case 3: Instrument Validation
1. Create groups with different instruments
2. Try reassigning student to mismatched group
3. Verify: Error message about instrument mismatch

### Test Case 4: Authorization
1. Teacher A creates groups
2. Teacher B tries to reassign Teacher A's students
3. Verify: Authorization error

## Browser Compatibility
- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive design

## Performance Considerations
- Modal loads group list from already-loaded dashboard data
- No additional API calls for group list
- Efficient single subscription update
- Batch group fill count refresh

## Future Enhancements
- Bulk reassignment for multiple students
- Reassignment history/audit log
- Undo reassignment option
- Automatic reassignment rules
- Student feedback on reassignment
- Email notifications on reassignment

## Troubleshooting

### Issue: "Group not found" error
**Solution**: Ensure the group exists and belongs to your profile

### Issue: "Full capacity" error
**Solution**: Remove a student from the target group first, or choose another group

### Issue: "Instrument mismatch" error
**Solution**: Can only reassign students to groups with matching instruments

### Issue: Modal won't open
**Solution**: Ensure you have at least one student in your groups

## Files Modified

1. **server/routes/teacher.js**
   - Added reassignment endpoint
   - Imported new controller function

2. **server/controllers/teacherController.js**
   - Added `reassignStudentToGroup` function
   - Implements all validation and business logic

3. **frontend/src/pages/TeacherDashboard.jsx**
   - Added reassignment state management
   - Added reassignment handler
   - Updated group card UI
   - Added reassignment modal component

## Support
For issues or feature requests, please contact the development team or submit feedback through the app.

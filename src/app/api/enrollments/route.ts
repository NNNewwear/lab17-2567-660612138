import { 
  zEnrollmentGetParam, 
  zEnrollmentPostBody, 
  zEnrollmentDeleteBody 
} from "@lib/schema";
import { DB, Student } from "@lib/DB";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request:NextRequest) => {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const courseNo = request.nextUrl.searchParams.get("courseNo");

  //validate input
  const parseResult = zEnrollmentGetParam.safeParse({
    studentId,
    courseNo,
  });
  if (parseResult.success === false) {
    return NextResponse.json(
      {
        ok: false,
        message: parseResult.error.issues[0].message,
      },
      { status: 400 }
    );
  }

  //check if user provide one of 'studentId' or 'courseNo'
  //User must not provide both values, and must not provide nothing

  if(studentId && courseNo || !studentId && !courseNo){
    return NextResponse.json(
      {
        ok: false,
        message: "Please provide either studentId or courseNo and not both!",
      },
      { status: 400 }
    );
  }

  //get all courses enrolled by a student
  if (studentId) {
    const courseNoList = [];
    for (const enroll of DB.enrollments) {
      if (enroll.studentId === studentId) {
        courseNoList.push(enroll.courseNo);
      }
    }

    const courses = [];
    for (const courseNo of courseNoList) {
      const course = DB.courses.find((x) => x.courseNo === courseNo);
      courses.push(course);
    }

    return NextResponse.json({
      ok: true,
      courses,
    });
    //get all students enrolled by a course
  } else if (courseNo) {
    const studentIdList = [];
    for (const enroll of DB.enrollments) {
      if(enroll.courseNo === courseNo){
        studentIdList.push(enroll.studentId);
      }
    }

    const students:Student[] = [];
    for(const studentId of studentIdList){
      const found_student = DB.students.find((std) => std.studentId === studentId);
      if(!found_student) return NextResponse.json({
        ok: false,
        message: 'Oops, something went wrong',
      },{ status: 500 })

      students.push(found_student);
    }

    return NextResponse.json({
      ok: true,
      students,
    });
  }
};

export const POST = async (request:NextRequest) => {
  const body = await request.json();
  const parseResult = zEnrollmentPostBody.safeParse(body);
  if (parseResult.success === false) {
    return NextResponse.json(
      {
        ok: false,
        message: parseResult.error.issues[0].message,
      },
      { status: 400 }
    );
  }

  const { studentId, courseNo } = body;

  const foundStudent = DB.students.find((x) => x.studentId === studentId);
  const foundCourse = DB.courses.find((x) => x.courseNo === courseNo);
  if (!foundStudent || !foundCourse) {
    return NextResponse.json(
      {
        ok: false,
        message: "Student Id or Course No is not existed",
      },
      { status: 400 }
    );
  }

  const foundEnroll = DB.enrollments.find(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (foundEnroll) {
    return NextResponse.json(
      {
        ok: false,
        message: "Student already enrolled that course",
      },
      { status: 400 }
    );
  }

  DB.enrollments.push({
    studentId,
    courseNo,
  });

  return NextResponse.json({
    ok: true,
    message: "Student has enrolled course",
  });
};

export const DELETE = async (request:NextRequest) => {
  const body = await request.json();

  //validate body request with zod schema
  const parseResult = zEnrollmentDeleteBody.safeParse(body);
  if (parseResult.success === false) {
    return NextResponse.json(
      {
        ok: false,
        message: parseResult.error.issues[0].message,
      },
      { status: 400 }
    );
  }

  const { studentId, courseNo } = body;

  //check if studentId and courseNo exist on enrollment

  const foundEnroll = DB.enrollments.find(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (!foundEnroll) {
    return NextResponse.json(
     {
       ok: false,
       message: "Enrollment does not exist",
     },
     { status: 404 }
   );
  }

  //perform deletion by using splice or array filter
  DB.enrollments.splice(DB.enrollments.indexOf(foundEnroll), 1);
  //if code reach here it means deletion is complete
  return NextResponse.json({
    ok: true,
    message: "Enrollment has been deleted",
  });
};


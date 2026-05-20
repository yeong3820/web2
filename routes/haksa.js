var express = require('express');
var router = express.Router();
var {getConnection} = require('./connect');
var oracledb = require('oracledb');

/* 교수 관리 페이지 */
router.get('/pro', function(req, res, next) {
  res.render('index', {title:'교수관리', pageName:'haksa/professors.ejs'});
});

// 교수등록 페이지
router.get('/pro/insert', async function(req, res) {
  let code;
  let con;
  try{
    con = await getConnection();
    const sql="select max(pcode)+1 from professors";
    const result=await con.execute(sql);
    code = result.rows[0][0];
  }catch(err){

  }finally{
    if(con) await con.close();
  }
  res.render('index.ejs', {title:'교수등록', pageName:'haksa/professors_insert.ejs', code});
});

/* 교수 데이터 생성 */
router.get('/pro/list.json', async function(req, res) {
    var con;
    try{
        con = await getConnection();
        let sql="select p.*, to_char(hiredate, 'YYYY-MM-DD') fdate, to_char(salary, '99,999,999') fsalary from professors p";
        sql += " order by pcode";
        const result = await con.execute(sql, {}, {outFormat:oracledb.OUT_FORMAT_OBJECT}); 
        res.send(result.rows);
    }catch(err){

    }finally{
        if(con) await con.close();
    }
});


//교수등록
router.post('/pro/insert', async function(req, res) {
  console.log('교수등록 요청 수신');
  const pcode = req.body.pcode;
  const pname = req.body.pname;
  const dept = req.body.dept;
  const title = req.body.title;
  const hiredate = req.body.hiredate;
  const salary = req.body.salary;
  console.log(pcode, pname, dept, title, hiredate, salary);
  
  let con;
  try {
    con = await getConnection();
    // 1. 컬럼 지정 순서에 맞춰 값을 매핑하되, hiredate는 TO_DATE 함수로 명시적 형변환을 해줍니다.
    let sql = "insert into professors(pcode, pname, dept, title, hiredate, salary) "; 
    sql += "values(:pcode, :pname, :dept, :title, TO_DATE(:hiredate, 'YYYY-MM-DD'), :salary)";
    
    await con.execute(sql, {pcode, pname, dept, title, hiredate, salary}, {autoCommit: true});
    
    // 2. 정상 완료 시에만 try 블록 안에서 200(성공) 응답을 보냅니다.
    res.sendStatus(200);
  } catch (err) {
    // 3. 에러 발생 시 콘솔에 상세 내용을 찍어 원인을 추적할 수 있도록 하고, 500(서버에러) 코드를 전송합니다.
    console.error("교수 등록 중 DB 에러 발생:", err);
    res.sendStatus(500);
  } finally {
    if (con) await con.close();
  }
});

//교수삭제 REST API
router.post('/pro/delete', async function(req, res) {
  const pcode=req.body.pcode;
  console.log(pcode);
  try{
    con = await getConnection();
    let sql="delete from professors where pcode=:pcode"; 
    await con.execute(sql, {pcode},{autoCommit:true});
    res.sendStatus(200);
  }catch(err){
    console.log(err);
    res.sendStatus(500);
  }finally{
    if(con) await con.close();
  }
});

/* 학생 관리 페이지 */
router.get('/stu', function(req, res, next) {
  res.render('index', {title:'학생관리', pageName:'haksa/students.ejs'});
});

// 학생목록 데이터
router.get('/stu/list.json', async function(req, res) {
  let con;
  try{
    con = await getConnection();
    let sql="select * from view_students order by scode desc";
    let result=await con.execute(sql, {}, {outFormat:oracledb.OUT_FORMAT_OBJECT});
    res.send(result.rows);
  }catch(err){
    console.error(err);
  }finally{
    if(con) await con.close();
  }
});

// 학생등록 페이지 이동
router.get('/stu/insert', async function(req, res) {
  let code;
  let con;
  try{
    con = await getConnection();
    let sql="select max(scode)+1 from students"; // 세미콜론(;) 제거
    let result = await con.execute(sql);
    code = result.rows[0][0]; // row -> rows 수정
  }catch(err){
    console.error(err);
  }finally{
    if(con) await con.close();
  }
  res.render('index', {title:'학생등록', pageName:'haksa/students_insert.ejs', code});
});

// 학생등록 처리 (REST API)
router.post('/stu/insert', async function(req, res){
  const scode=req.body.scode;
  const sname=req.body.sname;
  const dept=req.body.dept;
  const birthday=req.body.birthday;
  const year=req.body.year;
  const advisor=req.body.pcode;
  console.log(scode, sname, dept, birthday, year, advisor);
  let con;
  try{
    con = await getConnection(); // 함수 호출 괄호() 추가
    let sql="insert into students(scode, sname, dept, birthday, year, advisor)"; // birtyday 오타 수정
    sql += " values(:scode, :sname, :dept, to_date(:birthday, 'YYYY-MM-DD'), :year, :advisor)";
    
    // 바인딩 파라미터에 sname 누락되었던 부분 추가 완비
    await con.execute(sql, {scode, sname, dept, birthday, year, advisor}, {autoCommit:true});
    res.sendStatus(200);
  }catch(err){
    console.error("학생 등록 오류:", err);
    res.sendStatus(500);
  }finally{
    if(con) await con.close();
  }
});

// 학생삭제 처리
router.post('/stu/delete', async function(req, res) {
  const scode=req.body.scode;
  let con;
  try{
    con = await getConnection();
    let sql="delete from students where scode=:scode"; 
    await con.execute(sql, {scode},{autoCommit:true});
    res.sendStatus(200);
  }catch(err){
    console.error(err);
    res.sendStatus(500);
  }finally{
    if(con) await con.close();
  }
});

/* 강좌관리 관리 페이지 */
router.get('/cou', function(req, res, next) {
  res.render('index', {title:'강좌관리', pageName:'haksa/courses.ejs'});
});

// 파일 최하단에서 라우터 모듈을 한 번만 내보냅니다.
module.exports = router;

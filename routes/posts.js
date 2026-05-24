var express = require('express');
var router = express.Router();
var { getConnection } = require('./connect'); // DB 연결 모듈 경로
var oracledb = require('oracledb');

/* 게시판 화면 렌더링 */
router.get('/', function(req, res, next) {
  res.render('index', { title: '게시글', pageName: 'posts/list.ejs' });
});

/* 게시글 목록 데이터 반환 API (수업 시간 5개 컷 페이징 연동) */
router.get('/list.json', async function(req, res) {
  // 프론트엔드에서 page나 size가 안 넘어올 경우를 대비해 5개씩 컷하도록 기본값 세팅
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 5; 
  
  // 오라클 view_posts 뷰의 행 번호(rn) 구간 계산
  const startRow = (page - 1) * size + 1;
  const endRow = page * size;
  
  let con;
  try {
    con = await getConnection();
    
    // 1. view_posts 뷰에서 행 번호(rn) 범위를 제한하여 딱 5개 레코드만 조회 (sname, fmt_date 포함)
    let sql = "select * from view_posts where rn between :startRow and :endRow";
    let result = await con.execute(sql, { startRow, endRow }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const list = result.rows; // 조회된 5개의 게시글 배열

    // 2. 전체 페이지 개수 산정을 위해 전체 게시글 수 카운트 (conut -> count 오타 수정 완료)
    sql = "select count(*) from view_posts";
    result = await con.execute(sql);
    const total = result.rows[0][0]; // 전체 글 총 개수
    
    // 3. ★ 중요: 프론트엔드가 요구하는 객체 { list, total } 상자 구조로 전송
    res.send({ list, total });
    
  } catch(err) {
    console.log("게시글 목록 데이터 에러 발생:", err.message);
    res.status(500).send(err.message);
  } finally {
    if (con) await con.close();
  }
});

module.exports = router;
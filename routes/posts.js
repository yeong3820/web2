var express = require('express');
var router = express.Router();
var { getConnection } = require('./connect'); // 영민님의 로컬 DB 연결 함수
var oracledb = require('oracledb');

/* 게시판 메인 화면 렌더링 */
router.get('/', function(req, res, next) {
  res.render('index', { title: '게시글', pageName: 'posts/list.ejs' });
});

/* 게시글 목록 데이터 반환 API (5개씩 컷 페이징 지원) */
router.get('/list.json', async function(req, res) {
  // 프론트엔드에서 page나 size가 안 넘어올 경우를 대비한 기본값(5개씩 컷) 세팅
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 5;
  
  // 아까 생성한 view_posts 뷰의 행 번호(rn) 구간 동적 계산
  const startRow = (page - 1) * size + 1;
  const endRow = page * size;
  
  let con;
  try {
    con = await getConnection();
    
    // 1. 아까 세팅한 view_posts 뷰에서 행 번호(rn) 범위를 제한하여 게시글 조회 (sname, fmt_date 포함됨)
    let sql = "select * from view_posts where rn between :startRow and :endRow";
    let result = await con.execute(sql, { startRow, endRow }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const list = result.rows; // 5개의 데이터가 담긴 배열

    // 2. 전체 페이지 개수 산정을 위해 전체 게시글 수 카운트 (conut -> count 오타 수정 완료)
    sql = "select count(*) from view_posts";
    result = await con.execute(sql);
    const total = result.rows[0][0]; // 전체 글 총 개수
    
    // 3. ★ 가장 중요: 프론트엔드 Handlebars가 요구하는 객체 { list, total } 구조로 묶어서 전송
    res.send({ list, total });
    
  } catch(err) {
    console.log("게시글 목록 데이터 불러오기 에러:", err.message);
    res.status(500).send(err.message);
  } finally {
    if (con) await con.close();
  }
});

module.exports = router;
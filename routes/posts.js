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
    let page = parseInt(req.query.page) || 1;
    let size = parseInt(req.query.size) || 5;
    let word = req.query.word || '';
    let off_rows = (page - 1) * size;
    let con;
    try {
      con = await getConnection();
      let sql="select * from view_posts";
        sql += `where TITLE like '%${word}%' or content like '%${word}%' or sname like '%${word}%'`;
        sql += " order by ID DESC";
        sql += ` OFFSET ${off_rows} ROWS FETCH NEXT ${size} ROWS ONLY`;
      let result = await con.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      let list = result.rows;

      sql = "select count(*) from view_posts";
      sql += ` where TITLE like '%${word}%' or content like '%${word}%' or sname like '%${word}%'`;
      result = await con.execute(sql);
      let count=result.rows[0][0];

      res.send({ list, count });
    } catch (err) {
      console.error('게시글 목록 데이터', err.message);
    }finally {
      if (con) await con.close();
    }
});

// 글쓰기 페이지 이동
router.get('/insert', function(req, res) {
  res.render('index', { title: '글쓰기', pageName: 'posts/insert.ejs' });
});
module.exports = router;
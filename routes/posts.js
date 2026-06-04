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
        sql += ` where TITLE like '%${word}%' or content like '%${word}%' or sname like '%${word}%'`;
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

//게시글 등록
router.post('/insert', async function(req, res) {
  const title = req.body.title;
  const content = req.body.content;
  const writer = req.body.writer;
  let con;
  try {
    con = await getConnection();
    let sql = "insert into posts(title, content, writer) values(:title, :content, :writer)";
    await con.execute(sql, {title, content, writer}, {autoCommit: true});
    console.log('게시글 등록 성공', title, writer);
    res.sendStatus(200);
  } catch (err) {
    console.error('게시글 등록 오류:', err);
    res.status(500).json({ error: err.message });
  } finally { 
    if (con) await con.close();
  }
});

//게시글 수정 페이지
router.get('/update/:id', async function(req, res) {
  const id = req.params.id;
  let con;
  try {
    con = await getConnection();
    let sql = "select * from view_posts where id = :id";
    let result = await con.execute(sql, {id}, {outFormat: oracledb.OUT_FORMAT_OBJECT});
    let post = result.rows[0];
    if (!post) {
      res.status(404).send('게시글을 찾을 수 없습니다.');
      return;
    }
    res.render('index', { title: '글수정', pageName: 'posts/update.ejs', post });
  } catch (err) {
    console.error('게시글 수정 페이지 오류:', err);
    res.status(500).send('오류가 발생했습니다.');
  } finally {
    if (con) await con.close();
  }
});

//게시글 수정 처리
router.post('/update', async function(req, res) {
  const id = req.body.id;
  const title = req.body.title;
  const content = req.body.content;
  let con;
  try {
    con = await getConnection();
    let sql = "update posts set title=:title, content=:content where id=:id";
    await con.execute(sql, {title, content, id}, {autoCommit: true});
    console.log('게시글 수정 성공', id);
    res.sendStatus(200);
  } catch (err) {
    console.error('게시글 수정 오류:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (con) await con.close();
  }
});

//게시글 정보페이지 (반드시 맨 마지막에 위치해야 함 - /update 등 먼저 매칭)
router.get('/:id', async function(req, res) {
  const id = req.params.id;
  let con;
  try {
    con = await getConnection();
    let sql = "select * from view_posts where id = :id";
    let result = await con.execute(sql, {id}, {outFormat: oracledb.OUT_FORMAT_OBJECT});
    let post = result.rows[0];
    if (!post) {
      res.status(404).send('게시글을 찾을 수 없습니다.');
      return;
    }
    res.render('index', { title: post.TITLE, pageName: 'posts/read.ejs', post });
  }catch (err) {
    console.error('게시글 정보 조회 오류:', err.message);
    res.status(500).send('오류가 발생했습니다.');
  } finally {
    if (con) await con.close();
  }
});

//게시글 삭제
router.post('/delete', async function(req, res) {
  const id = req.body.id;
  let con;
  try {
    con = await getConnection();
    let sql = "delete from posts where id = :id";
    await con.execute(sql, {id}, {autoCommit: true});
    console.log('게시글 삭제', id);
    res.sendStatus(200);
  } catch (err) {
    console.error('게시글 삭제 오류:', err);
    res.status(500);
  } finally {
    if (con) await con.close();
  }
});

module.exports = router;
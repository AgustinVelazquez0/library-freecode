/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  /*
   * ----[EXAMPLE TEST]----
   * Each test should completely test the response of the API end-point including response status code!
   */
  test("#example Test GET /api/books", function (done) {
    chai
      .request(server)
      .get("/api/books")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, "response should be an array");
        assert.property(
          res.body[0],
          "commentcount",
          "Books in array should contain commentcount"
        );
        assert.property(
          res.body[0],
          "title",
          "Books in array should contain title"
        );
        assert.property(
          res.body[0],
          "_id",
          "Books in array should contain _id"
        );
        done();
      });
  });
  /*
   * ----[END of EXAMPLE TEST]----
   */

  suite("Routing tests", function () {
    let testBookId; // Para guardar el _id y usarlo en otros tests

    suite(
      "POST /api/books with title => create book object/expect book object",
      function () {
        test("Test POST /api/books with title", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "Test Book" }) // ✅ Enviamos un título
            .end(function (err, res) {
              assert.equal(res.status, 200); // ✅ Código 200
              assert.property(res.body, "title"); // ✅ Tiene propiedad title
              assert.property(res.body, "_id"); // ✅ Tiene _id
              assert.equal(res.body.title, "Test Book"); // ✅ El título coincide
              testBookId = res.body._id; // ✅ Guardamos el _id para futuros tests
              done();
            });
        });

        test("Test POST /api/books with no title given", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .send({}) // ❌ No enviamos título
            .end(function (err, res) {
              assert.equal(res.status, 200); // ✅ Igual responde 200
              assert.equal(res.text, "missing required field title"); // ✅ Devuelve el mensaje correcto
              done();
            });
        });
      }
    );

    suite("GET /api/books => array of books", function () {
      test("Test GET /api/books", function (done) {
        chai
          .request(server)
          .get("/api/books")
          .end(function (err, res) {
            assert.equal(res.status, 200); // ✅ Debe responder 200
            assert.isArray(res.body, "response should be an array"); // ✅ Tiene que ser un array
            if (res.body.length > 0) {
              assert.property(res.body[0], "title"); // ✅ Cada libro debe tener title
              assert.property(res.body[0], "_id"); // ✅ Cada libro debe tener _id
              assert.property(res.body[0], "commentcount"); // ✅ Cada libro debe tener commentcount
            }
            done();
          });
      });
    });

    suite("GET /api/books/[id] => book object with [id]", function () {
      test("Test GET /api/books/[id] with id not in db", function (done) {
        chai
          .request(server)
          .get("/api/books/000000000000000000000000") // ID válido pero no existente
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists");
            done();
          });
      });

      test("Test GET /api/books/[id] with valid id in db", function (done) {
        // Primero creamos un libro para asegurarnos que el ID existe
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "Libro de prueba para GET ID" })
          .end(function (err, res) {
            const bookId = res.body._id;

            // Luego usamos ese ID en el GET
            chai
              .request(server)
              .get("/api/books/" + bookId)
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, "title");
                assert.property(res.body, "_id");
                assert.property(res.body, "comments");
                assert.isArray(
                  res.body.comments,
                  "comments debería ser un array"
                );
                assert.equal(res.body._id, bookId);
                done();
              });
          });
      });
    });

    suite(
      "POST /api/books/[id] => add comment/expect book object with id",
      function () {
        test("Test POST /api/books/[id] with comment", function (done) {
          // Primero creamos un libro
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "Libro con comentario" })
            .end(function (err, res) {
              const bookId = res.body._id;

              // Ahora posteamos un comentario
              chai
                .request(server)
                .post("/api/books/" + bookId)
                .send({ comment: "Gran libro!" })
                .end(function (err, res) {
                  assert.equal(res.status, 200);
                  assert.property(res.body, "title");
                  assert.property(res.body, "_id");
                  assert.property(res.body, "comments");
                  assert.include(res.body.comments, "Gran libro!");
                  done();
                });
            });
        });

        test("Test POST /api/books/[id] without comment field", function (done) {
          // Creamos un libro para tener un ID válido
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "Libro sin comentario" })
            .end(function (err, res) {
              const bookId = res.body._id;

              // Enviamos el POST sin 'comment'
              chai
                .request(server)
                .post("/api/books/" + bookId)
                .send({})
                .end(function (err, res) {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, "missing required field comment");
                  done();
                });
            });
        });

        test("Test POST /api/books/[id] with comment, id not in db", function (done) {
          // Usamos un ObjectId válido pero inexistente
          chai
            .request(server)
            .post("/api/books/000000000000000000000000")
            .send({ comment: "Comentario perdido" })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "no book exists");
              done();
            });
        });
      }
    );

    suite("DELETE /api/books/[id] => delete book object id", function () {
      test("Test DELETE /api/books/[id] with valid id in db", function (done) {
        // Primero creamos un libro
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "Libro para eliminar" })
          .end(function (err, res) {
            const bookId = res.body._id;

            // Ahora lo eliminamos
            chai
              .request(server)
              .delete("/api/books/" + bookId)
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, "delete successful");
                done();
              });
          });
      });

      test("Test DELETE /api/books/[id] with id not in db", function (done) {
        // Usamos un ObjectId válido pero inexistente
        chai
          .request(server)
          .delete("/api/books/000000000000000000000000")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists");
            done();
          });
      });
    });
  });
});

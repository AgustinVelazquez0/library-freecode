"use strict";
const express = require("express");
const Book = require("../models/Book");

module.exports = function (app) {
  // Rutas para /api/books
  app
    .route("/api/books")
    .post(async function (req, res) {
      const title = req.body.title;

      // Si no se incluye title
      if (!title) {
        return res.send("missing required field title");
      }

      try {
        // Creamos y guardamos el libro
        const newBook = new Book({ title });
        await newBook.save();

        // Devolvemos el nuevo objeto
        res.json({
          _id: newBook._id,
          title: newBook.title,
        });
      } catch (err) {
        console.error(err);
        res.send("there was an error saving the book");
      }
    })
    .get(async function (req, res) {
      try {
        const books = await Book.find({});

        const formattedBooks = books.map((book) => ({
          _id: book._id,
          title: book.title,
          commentcount: book.comments.length,
        }));

        res.json(formattedBooks);
      } catch (err) {
        console.error(err);
        res.send("error retrieving books");
      }
    })
    // Para el test 7: DELETE todos los libros
    .delete(async function (req, res) {
      try {
        await Book.deleteMany({});
        return res.send("complete delete successful");
      } catch (err) {
        console.error(err);
        return res.status(500).send("error");
      }
    });

  // Rutas para /api/books/:id
  app
    .route("/api/books/:id")
    .get(async function (req, res) {
      const bookId = req.params.id;

      try {
        const book = await Book.findById(bookId);

        if (!book) {
          return res.send("no book exists");
        }

        res.json({
          _id: book._id,
          title: book.title,
          comments: book.comments,
        });
      } catch (err) {
        res.send("no book exists");
      }
    })
    // POST para agregar comentario a un libro específico (Test 5)
    .post(async function (req, res) {
      const bookid = req.params.id;
      const comment = req.body.comment;

      // Verificación simple de la existencia del comentario
      if (!comment) {
        return res.send("missing required field comment");
      }

      try {
        // Buscar el libro por ID
        const book = await Book.findById(bookid);

        // Si no se encuentra el libro
        if (!book) {
          return res.send("no book exists");
        }

        // Añadir el comentario y actualizar
        book.comments.push(comment);

        // Guardar los cambios
        await book.save();

        // Devolver el objeto actualizado
        return res.json({
          _id: book._id,
          title: book.title,
          comments: book.comments,
        });
      } catch (err) {
        console.error(err);
        return res.send("no book exists");
      }
    })
    // DELETE para eliminar un libro específico (Test 6)
    .delete(async function (req, res) {
      const bookid = req.params.id;

      try {
        const result = await Book.findByIdAndDelete(bookid);

        if (!result) {
          return res.send("no book exists");
        }

        return res.send("delete successful");
      } catch (err) {
        console.error(err);
        return res.send("no book exists");
      }
    });
};

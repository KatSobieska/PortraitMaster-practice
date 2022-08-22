const Photo = require("../models/photo.model");
const Voter = require("../models/Voter.model");
const requestIp = require("request-ip");
const path = require("path");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const titleMaxLength = 25;
    const authorMaxLength = 50;

    if (!title && !author && !email && !file) {
      return new Error("Wrong input!");
    }
    const authorPattern = new RegExp(
      /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
      "g"
    );
    const emailPattern = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "g");

    const authorMatched = author.match(authorPattern).join("");
    const emailMatched = email.match(emailPattern).join("");

    if (authorMatched.length < author.length) {
      throw new Error("Author is not valid");
    } else if (emailMatched.length < email.length) {
      throw new Error("Email is not valid");
    }

    const fileName = path.basename(file.path);
    const fileExt = path.extname(fileName);

    if (!fileExt === ".jpg" || !fileExt === ".png" || !fileExt === ".gif") {
      return new Error("Wrong file type!");
    }
    if (!title.length >= titleMaxLength && !author.length >= authorMaxLength) {
      return new Error("Wrong field length!");
    }
    const newPhoto = new Photo({
      title,
      author,
      email,
      src: fileName,
      votes: 0,
    });
    await newPhoto.save(); // ...save new photo in DB
    res.json(newPhoto);
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const userIP = requestIp.getClientIp(req);
    const findUser = await Voter.findOne({ user: userIP });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!photoToUpdate) {
      return res.status(404).json({ message: "Not found" });
    }
    if (findUser) {
      const findUserVote = findUser.votes.includes(photoToUpdate._id);
      if (findUserVote) {
        return res.status(500).json(err);
      }
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: "OK" });
    } else {
      const newVoter = new Voter({
        user: userIP,
        $push: { votes: photoToUpdate._id },
      });
      await newVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: "OK" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

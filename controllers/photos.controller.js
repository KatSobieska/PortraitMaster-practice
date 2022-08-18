const Photo = require("../models/photo.model");
const Voter = require("../models/Voter.model");
const requestIp = require("request-ip");
const path = require("path");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...

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

      if (
        (fileExt === ".jpg" || fileExt === ".png" || fileExt === ".gif") &&
        title.length <= 25 &&
        author.length <= 50
      ) {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error("Wrong file type!");
      }
    } else {
      throw new Error("Wrong input!");
    }
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

    if (findUser) {
      const findUserVote = findUser.votes.includes(photoToUpdate._id);
      if (findUserVote) {
        res.status(500).json(err);
      } else {
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: "OK" });
      }
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

    if (!photoToUpdate) res.status(404).json({ message: "Not found" });
  } catch (err) {
    res.status(500).json(err);
  }
};

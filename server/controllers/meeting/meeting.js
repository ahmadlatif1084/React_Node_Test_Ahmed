const MeetingHistory = require('../../model/schema/meeting')
const Meetings = require('../../model/schema/meeting')
const mongoose = require('mongoose');
const User = require('../../model/schema/user')

const add = async (req, res) => {
    try {
        const result = new Meetings(req.body);
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create :', err);
        res.status(400).json({ err, error: 'Failed to create' });
    }
}

const index = async (req, res) => {
    try {
        const query = req.query
        query.deleted = false;

        const user = await User.findById(req.user.userId)
        if (user?.role !== "superAdmin") {
            delete query.createBy
            query.$or = [{ createBy: new mongoose.Types.ObjectId(req.user.userId) }];
        }
        console.log("query", query);
        const result = await Meetings.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                }
            },
            {
                $project: {
                    users: 0,
                }
            },
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({ err, error: 'Failed ' });
    }
}

const view = async (req, res) => {
    try {
        let result = await Meetings.findOne({ _id: req.params.id })
        if (!result) return res.status(404).json({ message: "no Data Found." })

        let response = await Meetings.aggregate([
            { $match: { _id: result._id } },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                }
            },
            {
                $project: {
                    users: 0,
                }
            },
        ])

        res.status(200).json(response[0])
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({ err, error: 'Failed ' });
    }
}

const deleteData = async (req, res) => {
    try {
        const result = await Meetings.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "done", result: result })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

const deleteMany = async (req, res) => {
    try {
        const result = await Meetings.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
        res.status(200).json({ message: "done", result })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

module.exports = { add, index, view, deleteData, deleteMany }
import httpStatus from 'http-status';
import { findOne } from '../mongoose/resolvers';

export const upsert = (req, res) => {
  if (!req.model.schema.tree[req.params.slug]) {
    return res.status(httpStatus.NOT_FOUND).json({ error: 'not found' });
  }

  req.model.findOne({}, (err, doc) => {
    let global = {};

    if (!doc) {
      if (req.params.slug) {
        global[req.params.slug] = req.body;
      } else {
        global = req.body;
      }
      return req.model.create(global, (err, result) => {
        if (err) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

        return res.status(httpStatus.CREATED)
          .json({
            message: 'success',
            result: result.toJSON({ virtuals: true }),
          });
      });
    }

    if (!doc[req.params.slug]) {
      // eslint-disable-next-line no-param-reassign
      doc[req.params.slug] = {};
    }

    Object.keys(req.body).forEach((e) => {
      // eslint-disable-next-line no-param-reassign
      doc[req.params.slug][e] = req.body[e];
    });

    return doc.save((err) => {
      if (err) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

      return res.json({
        message: 'success',
        result: doc.toJSON({ virtuals: true }),
      });
    });
  });
};

export const fetch = (req, res) => {
  const query = {
    Model: req.model,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  findOne(query)
    .then((doc) => {
      const globals = { ...doc };

      if (globals[req.params.key]) {
        return res.json(globals[req.params.key]);
      } if (req.params.key) {
        return res.status(httpStatus.NOT_FOUND)
          .json({ error: 'not found' });
      }
      return res.json(globals);
    })
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err }));
};
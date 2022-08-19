"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const {BadRequestError, UnauthorizedError} = require('../expressError')

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }


  get customerId() {
    return this._customerId;
  }

  set customerId(val) {
    if (!this.customerId) {
      this._customerId = val;
    } else {
      throw new UnauthorizedError("Not authorized to change customer ID");
    }
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (val < 1)
      throw new BadRequestError("Number of guests must be at least 1");
    this._numGuests = val;
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(val) {
    if (isNaN(val))
      throw new BadRequestError("Provide valid date");
    this._startAt = val;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a reservation id, find the reservation. */

    static async getReservation(id) {
      const results = await db.query(
            `SELECT id,
                    customer_id AS "customerId",
                    num_guests AS "numGuests",
                    start_at AS "startAt",
                    notes AS "notes"
             FROM reservations
             WHERE id = $1`,
          [id],
      );

      return results.rows[0];
    }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET customer_id=$1,
                 num_guests=$2,
                 start_at=$3,
                 notes=$4
             WHERE id = $5`, [
            this.customerId,
            this.numGuests,
            this.startAt,
            this.notes,
            this.id,
          ],
      );
    }
  }
}


module.exports = Reservation;

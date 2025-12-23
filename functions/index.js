const admin = require("firebase-admin");
const {
  onSchedule,
} = require("firebase-functions/v2/scheduler");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");

admin.initializeApp();
const db = admin.firestore();

/**
 * Send push notification using Firebase Admin SDK
 */

/**
 * Sends a push notification to a list of users via FCM.
 *
 * @param {string[]} userIds - Array of user IDs to notify
 * @param {Object} payload - Notification payload
 * @param {Object} payload.notification - Notification object
 * @param {string} payload.notification.title - Notification title
 * @param {string} payload.notification.body - Notification body
 * @param {Object} payload.data - Custom data payload
 * @return {Promise<void>} Resolves when notifications are sent
 */
async function sendPushToUsers(userIds, payload) {
  try {
    const tokens = [];

    for (const userId of userIds) {
      const userDoc = await db.collection("users").doc(userId).get();

      if (userDoc.exists && userDoc.data().fcmTokens) {
        const userTokens = userDoc.data().fcmTokens;
        tokens.push(...userTokens);
      }
    }

    if (tokens.length === 0) {
      console.log("No FCM tokens found for users:", userIds);
      return;
    }

    // Send notification using Admin SDK
    const message = {
      notification: {
        title: payload.notification.title,
        body: payload.notification.body,
      },
      data: payload.data || {},
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`Successfully sent ${response.successCount} notifications`);
    console.log(`Failed to send ${response.failureCount} notifications`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log("Failed tokens:", failedTokens);
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}


/**
 * M24: Auto-expire emergencies after 24 hours
 */
exports.autoExpireEmergencies = onSchedule(
    {
      schedule: "every 1 hours",
      timeZone: "Europe/Vienna",
    },
    async () => {
      const now = admin.firestore.Timestamp.now();
      const cutoff = new Date(
          now.toDate().getTime() - 24 * 60 * 60 * 1000,
      );

      const snapshot = await db
          .collection("emergencies")
          .where("status", "==", "active")
          .where(
              "createdAt",
              "<",
              admin.firestore.Timestamp.fromDate(cutoff),
          )
          .get();

      if (snapshot.empty) {
        return;
      }

      const batch = db.batch();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: "expired",
          resolvedAt: now,
          resolvedBy: "system",
        });
      });

      await batch.commit();
      console.log(`Expired ${snapshot.size} emergencies`);
    },
);

/**
 * M22: Emergency created → notify recipients
 */
exports.onEmergencyCreated = onDocumentCreated(
    "emergencies/{emergencyId}",
    async (event) => {
      const emergency = event.data.data();

      const typeNames = {
        tampon: "Tampon Emergency",
        pads: "Pads Emergency",
        painkiller: "Painkiller Needed",
        the_ear: "Needs Support",
        the_pms: "PMS Support Needed",
      };

      const title =
      typeNames[emergency.type] || "Emergency Alert";

      const body =
      emergency.message ||
      "Someone in your circle needs help";

      await sendPushToUsers(
          emergency.recipients,
          {
            notification: {
              title,
              body,
            },
            data: {
              type: "emergency",
              emergencyId: event.params.emergencyId,
            },
          },
      );
    },
);

/**
 * M25–M29: Voucher received → notify recipient
 */
exports.onVoucherCreated = onDocumentCreated(
    "vouchers/{voucherId}",
    async (event) => {
      const voucher = event.data.data();

      const voucherNames = {
        chocolate: "Chocolate",
        tea: "Tea",
        coffee: "Coffee",
        chips: "Chips",
        face_mask: "Face Mask",
        love: "Love",
      };

      const title = "You received a care voucher 💜";
      const body = `You received ${
        voucherNames[voucher.type] || "a voucher"
      }`;

      await sendPushToUsers(
          [voucher.recipientId],
          {
            notification: {
              title,
              body,
            },
            data: {
              type: "voucher",
              voucherId: event.params.voucherId,
            },
          },
      );
    },
);

/**
 * S3: Voucher redeemed → notify sender
 */
exports.onVoucherRedeemed = onDocumentUpdated(
    "vouchers/{voucherId}",
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (
        before.status === "unredeemed" &&
      after.status === "redeemed"
      ) {
        const title = "Voucher redeemed 🎉";
        const body =
        "Your care voucher was just redeemed";

        await sendPushToUsers(
            [after.senderId],
            {
              notification: {
                title,
                body,
              },
              data: {
                type: "voucher_redeemed",
                voucherId: event.params.voucherId,
              },
            },
        );
      }
    },
);

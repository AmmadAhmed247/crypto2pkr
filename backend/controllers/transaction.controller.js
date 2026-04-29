import Transaction from "../models/TransactionSchema.js";


export const getAllTransaction = async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 });
    res.status(200).json(txs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserTransaction = async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    const userAddr = address.toLowerCase();
    const [txs, stats] = await Promise.all([
      Transaction.find({ userAddress: userAddr }).sort({ createdAt: -1 }),

      Transaction.aggregate([
        { $match: { userAddress: userAddr } },
        {
          $group: {
            _id: null,
            totalPkr: {
              $sum: {
                $toDouble: {
                  $replaceAll: {
                    input: "$pkrAmount",
                    find: ",",
                    replacement: "",
                  },
                },
              },
            },
            totalUsd: {
              $sum: { $toDouble: "$lockedAmount" },
            },
          },
        },
      ]),
    ]);

    const stat = stats[0] || { totalPkr: 0, totalUsd: 0 };
    return res.status(200).json({
      transactions: txs,
      totalUsd: stat.totalUsd.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      totalPkr: stat.totalPkr.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getAccountStats = async (req, res) => {
  try {
    const { address } = req.params;
    const userAddr = address.toLowerCase();

    const stats = await Transaction.aggregate([
      { $match: { userAddress: userAddr } },

      {
        $addFields: {
          pkrNumeric: {
            $toDouble: {
              $replaceAll: {
                input: "$pkrAmount",
                find: ",",
                replacement: "",
              },
            },
          },
          usdNumeric: { $toDouble: "$lockedAmount" },
          symbol: { $toLower: "$tokenSymbol" },
        },
      },

      {
        $group: {
          _id: null,

          totalBridged: {
            $sum: {
              $cond: [{ $eq: ["$type", "BRIDGE"] }, "$pkrNumeric", 0],
            },
          },

          totalClaiming: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "BRIDGE"] },
                    { $eq: ["$status", "LOCKED"] },
                  ],
                },
                "$pkrNumeric",
                0,
              ],
            },
          },

          ethTotal: {
            $sum: {
              $cond: [{ $eq: ["$symbol", "eth"] }, "$usdNumeric", 0],
            },
          },

          usdcTotal: {
            $sum: {
              $cond: [{ $eq: ["$symbol", "usdc"] }, "$usdNumeric", 0],
            },
          },

          count: { $sum: 1 },
        },
      },
    ]);

    const data = stats[0] || {
      totalBridged: 0,
      totalClaiming: 0,
      ethTotal: 0,
      usdcTotal: 0,
      count: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalBridged: data.totalBridged.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
        totalClaiming: data.totalClaiming.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
        ethTotal: data.ethTotal.toFixed(4),
        usdcTotal: data.usdcTotal.toFixed(2),
        count: data.count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
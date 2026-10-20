import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';

/**
 * LangGraph 的短期记忆（checkpointer）落 MongoDB。
 *
 * 复用 Nest 已经建立的 mongoose 连接；如果 mongoose 尚未就绪，
 * 则用同一份 MONGODB_URI 单独建连。
 */
export const createMongoCheckpointer = async (): Promise<MongoDBSaver> => {
  const conn: any = mongoose.connection;
  let client: MongoClient;

  if (conn && typeof conn.getClient === 'function' && conn.readyState === 1) {
    client = conn.getClient();
  } else {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('缺少 MONGODB_URI 配置：LangGraph 的 checkpoint 需要 MongoDB');
    }

    const username = process.env.user;
    const password = process.env.pass;
    const authSource = process.env.authSource || 'admin';
    const tmp = new MongoClient(
      uri,
      username && password
        ? {
            auth: { username, password },
            authSource,
          }
        : {},
    );
    await tmp.connect();
    client = tmp;
  }

  const dbName =
    process.env.DB_NAME ||
    ((mongoose.connection as any)?.db?.databaseName as string) ||
    'chat_robot';

  return new MongoDBSaver({
    client,
    dbName,
    checkpointCollectionName: 'agent_checkpoints',
    checkpointWritesCollectionName: 'agent_checkpoints_writes',
  });
};

let checkpointerPromise: Promise<MongoDBSaver> | null = null;

/** 进程内复用同一个 checkpointer 实例 */
export const getMongoCheckpointer = (): Promise<MongoDBSaver> => {
  if (!checkpointerPromise) {
    checkpointerPromise = createMongoCheckpointer().catch((error) => {
      checkpointerPromise = null;
      throw error;
    });
  }
  return checkpointerPromise;
};

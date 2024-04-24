import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { Message } from "./Message"
import { Workflow } from "../main/Workflow"
import { dbClient } from "../../dbClient"

export class LatestMessage extends CommonModel {
  public workflow_uuid!: string
  public latest_message_uuid!: string
}

LatestMessage.init(
  {
    ...commonFields,
    workflow_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: Workflow, key: 'uuid' }
    },
    latest_message_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: Message, key: 'uuid' }
    }
  },
  {
    tableName: "latest_message",
    sequelize: dbClient,
    timestamps: false,
    schema: 'gpt'
  }
)

import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./../main/User"
import { Note } from "./Note"
import { dbClient } from "../../dbClient"

export class ActionItem extends CommonModel {
  user_uuid!: string
  body?: string
  estimate?: string
  priority?: string
  status!: string
  previous_action_item_uuid?: string
  next_action_item_uuid?: string
  note_uuid!: string
  advice_tooltip?: string
}

ActionItem.init(
  {
    ...commonFields,
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'uuid' }
    },
    body: {
      type: DataTypes.STRING
    },
    estimate: {
      type: DataTypes.STRING
    },
    priority: {
      type: DataTypes.STRING,
      validate: { isIn: [["lowest", "low", "medium", "high", "highest"]] }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["open", "in_progress", "closed"]] }
    },
    previous_action_item_uuid: {
      type: DataTypes.UUID,
      references: { model: ActionItem, key: 'uuid' }
    },
    next_action_item_uuid: {
      type: DataTypes.UUID,
      references: { model: ActionItem, key: 'uuid' }
    },
    note_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Note, key: 'uuid' }
    },
    advice_tooltip: {
      type: DataTypes.STRING
    },
  },
  {
    tableName: "action_item",
    sequelize: dbClient,
    timestamps: false,
    schema: 'productivity'
  }
)

export type MediaPlayerEntity = {
  entity_id: string;
  state: string;
  attributes: {
    source_list: string[];
    volume_level: number;
    media_content_id: string;
    media_content_type: string;
    media_duration: number;
    media_position: number;
    media_position_updated_at: string;
    media_title: string;
    media_artist: string;
    media_album_name: string;
    media_track: number;
    source: string;
    shuffle: boolean;
    repeat: string;
    entity_picture: string;
    icon: string;
    friendly_name: string;
    supported_features: number;
  };
  context: {
    id: string;
    parent_id: string;
    user_id: string;
  };
  last_changed: string;
  last_updated: string;
};

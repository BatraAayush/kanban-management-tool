import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import type { IProject, IBoard } from "../../types";

interface ProjectState {
  projects: IProject[];
  currentProject: IProject | null;
  boards: IBoard[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  boards: [],
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/projects");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch projects",
      );
    }
  },
);

export const fetchProjectDetails = createAsyncThunk(
  "projects/fetchDetails",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load project",
      );
    }
  },
);

export const createNewProject = createAsyncThunk(
  "projects/create",
  async (
    data: { title: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post("/projects", data);
      return res.data.data.project;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create project",
      );
    }
  },
);

export const updateProjectApi = createAsyncThunk(
  "projects/update",
  async (
    {
      projectId,
      title,
      description,
    }: { projectId: string; title: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.patch(`/projects/${projectId}`, {
        title,
        description,
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update project",
      );
    }
  },
);

export const deleteProjectApi = createAsyncThunk(
  "projects/delete",
  async (projectId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${projectId}`);
      return projectId;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete project",
      );
    }
  },
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Add this cleanup reducer:
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.boards = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.currentProject = action.payload.project;
        state.boards = action.payload.boards;
      })
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      .addCase(updateProjectApi.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        const index = state.projects.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(deleteProjectApi.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      });
  },
});

export const { clearCurrentProject } = projectSlice.actions; 

export default projectSlice.reducer;
